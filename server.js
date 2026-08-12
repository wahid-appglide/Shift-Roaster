const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, 'data.json');
const PUBLIC = path.join(ROOT, 'public');

const SPECIAL = ['M', 'E', 'N'];

const SHIFT_NAMES = {
  M: 'Morning',
  G: 'General',
  E: 'Evening',
  N: 'Night',
  O: 'Weekly off',
  L: 'Approved leave'
};

const HOLIDAYS_2026 = [
  '2026-01-01',
  '2026-01-15',
  '2026-01-26',
  '2026-03-21',
  '2026-04-03',
  '2026-04-14',
  '2026-05-01',
  '2026-08-15',
  '2026-09-04',
  '2026-09-14',
  '2026-10-02',
  '2026-10-19',
  '2026-11-08',
  '2026-12-25'
];

const baseCodes = [
  'G-N-1',
  'G-N-2',
  'G-N-3',
  'G-M-1',
  'G-M-2',
  'G-E-1',
  'G-E-2',
  'G-G-1',
  'G-G-2',
  'G-G-3',
  'G4',
  'G5'
];

const employees = Array.from(
  { length: 30 },
  (_, i) => {
    const code =
      baseCodes[i] ||
      `EMP-${String(i + 1).padStart(2, '0')}`;

    return {
      id: `emp-${i + 1}`,
      code,
      name: code,
      active: true
    };
  }
);

const rotation = {
  'G-N-1': 'G-G-2',
  'G-N-2': 'G-E-1',
  'G-N-3': 'G-N-1',
  'G-M-1': 'G-G-3',
  'G-M-2': 'G-M-1',
  'G-E-1': 'G-N-2',
  'G-E-2': 'G-M-2',
  'G-G-1': 'G-E-2',
  'G-G-2': 'G-G-1',
  'G-G-3': 'G-N-3'
};

function defaults() {
  return {
    employees,
    rotation,
    holidays: HOLIDAYS_2026,
    leaves: [],
    shiftRequests: [],
    rosters: {},

    users: [
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin'
      },
      {
        username: 'manager',
        password: 'manager123',
        role: 'manager'
      },
      {
        username: 'employee',
        password: 'employee123',
        role: 'employee',
        employeeId: 'emp-1'
      }
    ]
  };
}

function load() {
  try {
    const old = JSON.parse(
      fs.readFileSync(DATA_FILE, 'utf8')
    );

    const base = defaults();

    return {
      ...base,
      ...old,

      employees:
        Array.isArray(old.employees) &&
        old.employees.length > 0
          ? old.employees
          : employees,

      leaves:
        Array.isArray(old.leaves)
          ? old.leaves
          : [],

      shiftRequests:
        Array.isArray(old.shiftRequests)
          ? old.shiftRequests
          : [],

      rosters:
        old.rosters &&
        typeof old.rosters === 'object'
          ? old.rosters
          : {},

      users:
        Array.isArray(old.users) &&
        old.users.length > 0
          ? old.users
          : base.users
    };
  } catch {
    return defaults();
  }
}

function save(data) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(data, null, 2)
  );
}

function key(d) {
  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

function dateFrom(k) {
  const [y, m, d] = k
    .split('-')
    .map(Number);

  return new Date(y, m - 1, d);
}

function monthDates(month) {
  const [y, m] = month
    .split('-')
    .map(Number);

  const d = new Date(y, m - 1, 1);
  const out = [];

  while (d.getMonth() === m - 1) {
    out.push(key(d));
    d.setDate(d.getDate() + 1);
  }

  return out;
}

function weekday(k) {
  const n = dateFrom(k).getDay();

  return n === 0 || n === 6;
}

function isWeekendOrHoliday(k, holidays) {
  return (
    weekday(k) ||
    holidays.includes(k)
  );
}

function requirement(k, holidays) {
  if (isWeekendOrHoliday(k, holidays)) {
    return {
      M: 1,
      G: 1,
      E: 1,
      N: 2
    };
  }

  return {
    M: 1,
    G: 3,
    E: 2,
    N: 2
  };
}

function weekKey(k) {
  const d = dateFrom(k);

  d.setDate(
    d.getDate() -
      ((d.getDay() + 6) % 7)
  );

  return key(d);
}

function inLeave(eid, date, data) {
  return data.leaves.some(
    (l) =>
      l.employeeId === eid &&
      l.status === 'approved' &&
      l.startDate <= date &&
      l.endDate >= date
  );
}

function shiftAt(rows, date, eid) {
  return (
    (rows[date] || []).find(
      (a) => a.employeeId === eid
    )?.shift || 'O'
  );
}

function recoveryNeeded(
  rows,
  dates,
  index,
  eid
) {
  let p = index - 1;
  let rest = 0;

  while (
    p >= 0 &&
    ['O', 'L'].includes(
      shiftAt(rows, dates[p], eid)
    )
  ) {
    rest++;
    p--;
  }

  let nights = 0;

  while (
    p >= 0 &&
    shiftAt(rows, dates[p], eid) === 'N'
  ) {
    nights++;
    p--;
  }

  return (
    nights > 0 &&
    rest < (nights >= 3 ? 2 : 1)
  );
}

function rosterStats(
  rows,
  dates,
  emps
) {
  const stats = Object.fromEntries(
    emps.map((e) => [
      e.id,
      {
        M: 0,
        G: 0,
        E: 0,
        N: 0,
        weekend: 0,
        holiday: 0,
        off: {}
      }
    ])
  );

  for (const d of dates) {
    for (const a of rows[d] || []) {
      const s =
        stats[a.employeeId];

      if (!s) continue;

      if (
        ['M', 'G', 'E', 'N'].includes(
          a.shift
        )
      ) {
        s[a.shift]++;
      }

      if (
        ['O', 'L'].includes(
          a.shift
        )
      ) {
        const wk = weekKey(d);

        s.off[wk] =
          (s.off[wk] || 0) + 1;
      }
    }
  }

  return stats;
}

function generateMonth(
  month,
  data
) {
  const ds = monthDates(month);

  const emps =
    data.employees.filter(
      (e) => e.active !== false
    );

  if (emps.length < 8) {
    throw Error(
      'At least 8 active employees are required.'
    );
  }

  const rows = {};

  const stats =
    Object.fromEntries(
      emps.map((e) => [
        e.id,
        {
          M: 0,
          G: 0,
          E: 0,
          N: 0,
          weekend: 0,
          holiday: 0,
          off: {}
        }
      ])
    );

  for (
    let i = 0;
    i < ds.length;
    i++
  ) {
    const date = ds[i];

    const req = requirement(
      date,
      data.holidays
    );

    const wk = weekKey(date);

    const weekDates = ds.filter(
      (d) =>
        weekKey(d) === wk
    );

    const daysLeft =
      weekDates.slice(
        weekDates.indexOf(date)
      ).length;

    rows[date] = [];

    const nonWorking =
      new Set();

    /*
     * APPROVED LEAVE
     */
    for (const e of emps) {
      if (
        inLeave(
          e.id,
          date,
          data
        )
      ) {
        rows[date].push({
          employeeId: e.id,
          shift: 'L'
        });

        nonWorking.add(e.id);

        stats[e.id].off[wk] =
          (stats[e.id].off[wk] || 0) +
          1;
      }
    }

    /*
     * RECOVERY AFTER NIGHT SHIFT
     */
    for (const e of emps) {
      if (
        !nonWorking.has(e.id) &&
        recoveryNeeded(
          rows,
          ds,
          i,
          e.id
        )
      ) {
        rows[date].push({
          employeeId: e.id,
          shift: 'O'
        });

        nonWorking.add(e.id);

        stats[e.id].off[wk] =
          (stats[e.id].off[wk] || 0) +
          1;
      }
    }

    /*
     * WEEKLY OFF DISTRIBUTION
     */
    const completeWeek =
      weekDates.length === 7;

    const offTarget =
      completeWeek
        ? Math.ceil(
            (emps.length * 2) / 7
          )
        : 0;

    const offPool = emps
      .filter(
        (e) =>
          !nonWorking.has(e.id)
      )
      .sort(
        (a, b) =>
          (stats[a.id].off[wk] || 0) -
            (stats[b.id].off[wk] ||
              0) ||
          a.code.localeCompare(
            b.code
          )
      );

    const mandatory =
      completeWeek
        ? offPool.filter(
            (e) =>
              (stats[e.id].off[wk] ||
                0) +
                daysLeft <=
              2
          )
        : [];

    const desired = Math.max(
      offTarget,
      mandatory.length
    );

    for (
      const e of offPool.slice(
        0,
        desired
      )
    ) {
      rows[date].push({
        employeeId: e.id,
        shift: 'O'
      });

      nonWorking.add(e.id);

      stats[e.id].off[wk] =
        (stats[e.id].off[wk] || 0) +
        1;
    }

    const assigned =
      new Set(nonWorking);

    /*
     * MORNING / EVENING / NIGHT
     */
    for (const shift of [
      'N',
      'M',
      'E'
    ]) {
      for (
        let slot = 0;
        slot < req[shift];
        slot++
      ) {
        let pool = emps
          .filter(
            (e) =>
              !assigned.has(e.id)
          )
          .filter(
            (e) =>
              shift !== 'N' ||
              !recoveryNeeded(
                rows,
                ds,
                i,
                e.id
              )
          );

        /*
         * Maximum 3 consecutive night shifts
         */
        if (shift === 'N') {
          pool = pool.filter(
            (e) => {
              let run = 0;

              for (
                let p = i - 1;
                p >= 0 &&
                shiftAt(
                  rows,
                  ds[p],
                  e.id
                ) === 'N';
                p--
              ) {
                run++;
              }

              return run < 3;
            }
          );
        }

        if (!pool.length) {
          throw Error(
            `No eligible employee for ${SHIFT_NAMES[shift]} on ${date}.`
          );
        }

        pool.sort(
          (a, b) => {
            const aa =
              stats[a.id];

            const bb =
              stats[b.id];

            const bonus =
              isWeekendOrHoliday(
                date,
                data.holidays
              );

            return (
              aa[shift] -
                bb[shift] ||
              (bonus
                ? aa.weekend +
                    aa.holiday -
                    (bb.weekend +
                      bb.holiday)
                : 0) ||
              a.code.localeCompare(
                b.code
              )
            );
          }
        );

        const e = pool[0];

        rows[date].push({
          employeeId: e.id,
          shift
        });

        assigned.add(e.id);

        stats[e.id][shift]++;

        if (weekday(date)) {
          stats[e.id].weekend++;
        }

        if (
          data.holidays.includes(
            date
          )
        ) {
          stats[e.id].holiday++;
        }
      }
    }

    /*
     * GENERAL SHIFT
     *
     * WEEKEND / COMPANY HOLIDAY:
     * exactly ONE General employee.
     *
     * WEEKDAY:
     * remaining employees can be General.
     */
    if (
      isWeekendOrHoliday(
        date,
        data.holidays
      )
    ) {
      const generalPool =
        emps
          .filter(
            (e) =>
              !assigned.has(e.id)
          )
          .sort(
            (a, b) =>
              stats[a.id].G -
                stats[b.id].G ||
              a.code.localeCompare(
                b.code
              )
          );

      /*
       * Assign exactly ONE General
       */
      if (
        generalPool.length > 0
      ) {
        const general =
          generalPool[0];

        rows[date].push({
          employeeId:
            general.id,
          shift: 'G'
        });

        assigned.add(
          general.id
        );

        stats[
          general.id
        ].G++;
      }

      /*
       * EVERY OTHER EMPLOYEE:
       * Weekly Off
       */
      for (const e of emps) {
        if (
          !assigned.has(e.id)
        ) {
          rows[date].push({
            employeeId: e.id,
            shift: 'O'
          });

          assigned.add(e.id);

          stats[e.id].off[wk] =
            (stats[e.id].off[wk] ||
              0) + 1;
        }
      }
    } else {
      /*
       * WEEKDAY:
       * Remaining employees go to General
       */
      for (const e of emps) {
        if (
          !assigned.has(e.id)
        ) {
          rows[date].push({
            employeeId: e.id,
            shift: 'G'
          });

          assigned.add(e.id);

          stats[e.id].G++;
        }
      }
    }
  }

  const roster = {
    month,
    dates: ds,
    assignments: rows,
    createdAt:
      new Date().toISOString()
  };

  roster.validation =
    validate(
      roster,
      data
    );

  roster.stats =
    rosterStats(
      rows,
      ds,
      emps
    );

  return roster;
}

function validate(
  roster,
  data
) {
  const issues = [];

  const emps =
    data.employees.filter(
      (e) => e.active !== false
    );

  const ds = roster.dates;

  const rows =
    roster.assignments;

  for (const d of ds) {
    const actual = {
      M: 0,
      G: 0,
      E: 0,
      N: 0
    };

    const seen =
      new Set();

    const req =
      requirement(
        d,
        data.holidays
      );

    for (
      const a of rows[d] || []
    ) {
      if (
        seen.has(
          a.employeeId
        )
      ) {
        issues.push(
          `${d}: ${a.employeeId} has more than one assignment.`
        );
      }

      seen.add(
        a.employeeId
      );

      if (
        actual[a.shift] !==
        undefined
      ) {
        actual[a.shift]++;
      }

      if (
        a.shift !== 'L' &&
        inLeave(
          a.employeeId,
          d,
          data
        )
      ) {
        issues.push(
          `${d}: employee is assigned while on approved leave.`
        );
      }
    }

    /*
     * Check required M/E/N
     */
    for (
      const s of SPECIAL
    ) {
      if (
        actual[s] <
        req[s]
      ) {
        issues.push(
          `${d}: ${SHIFT_NAMES[s]} coverage is short by ${
            req[s] - actual[s]
          }.`
        );
      }
    }

    /*
     * Check General
     */
    if (
      actual.G <
      req.G
    ) {
      issues.push(
        `${d}: General coverage is short by ${
          req.G - actual.G
        }.`
      );
    }

    /*
     * IMPORTANT:
     * Weekend / holiday must have
     * EXACTLY 1 General.
     */
    if (
      isWeekendOrHoliday(
        d,
        data.holidays
      ) &&
      actual.G !== 1
    ) {
      issues.push(
        `${d}: Weekend/holiday must have exactly 1 General employee, found ${actual.G}.`
      );
    }
  }

  /*
   * Employee recovery and weekly offs
   */
  for (const e of emps) {
    for (
      let i = 0;
      i < ds.length;
      i++
    ) {
      const s =
        shiftAt(
          rows,
          ds[i],
          e.id
        );

      if (
        recoveryNeeded(
          rows,
          ds,
          i,
          e.id
        ) &&
        ![
          'O',
          'L',
          'N'
        ].includes(s)
      ) {
        issues.push(
          `${e.code}: recovery rest missing on ${ds[i]}.`
        );
      }
    }

    const weeks = [
      ...new Set(
        ds.map(weekKey)
      )
    ];

    for (
      const wk of weeks
    ) {
      const days =
        ds.filter(
          (d) =>
            weekKey(d) === wk
        );

      if (
        days.length === 7
      ) {
        const off =
          days.filter(
            (d) =>
              [
                'O',
                'L'
              ].includes(
                shiftAt(
                  rows,
                  d,
                  e.id
                )
              )
          ).length;

        if (off < 2) {
          issues.push(
            `${e.code}: fewer than 2 off-days in week beginning ${wk}.`
          );
        }
      }
    }
  }

  return [
    ...new Set(issues)
  ];
}

/*
 * ROLE HELPERS
 */
function role(req) {
  return (
    req.headers['x-role'] ||
    'employee'
  );
}

function employeeId(req) {
  return (
    req.headers[
      'x-employee-id'
    ] || null
  );
}

function allowed(
  req,
  ...roles
) {
  if (
    !roles.includes(
      role(req)
    )
  ) {
    throw Error(
      'You do not have permission for this action.'
    );
  }
}

/*
 * JSON RESPONSE WITH CORS
 */
function json(
  res,
  status,
  x
) {
  res.writeHead(
    status,
    {
      'Content-Type':
        'application/json',
      'Access-Control-Allow-Origin':
        'http://localhost:5173',
      'Access-Control-Allow-Methods':
        'GET,POST,PUT,PATCH,OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type, x-role, x-employee-id'
    }
  );

  res.end(
    JSON.stringify(x)
  );
}

function body(req) {
  return new Promise(
    (resolve, reject) => {
      let s = '';

      req.on(
        'data',
        (x) =>
          (s += x)
      );

      req.on(
        'end',
        () => {
          try {
            resolve(
              s
                ? JSON.parse(s)
                : {}
            );
          } catch (e) {
            reject(e);
          }
        }
      );
    }
  );
}

/*
 * SERVER
 */
const server =
  http.createServer(
    async (
      req,
      res
    ) => {
      const url =
        new URL(
          req.url,
          'http://localhost'
        );

      try {
        /*
         * CORS PREFLIGHT
         */
        if (
          req.method ===
          'OPTIONS'
        ) {
          res.writeHead(
            204,
            {
              'Access-Control-Allow-Origin':
                'http://localhost:5173',
              'Access-Control-Allow-Methods':
                'GET,POST,PUT,PATCH,OPTIONS',
              'Access-Control-Allow-Headers':
                'Content-Type, x-role, x-employee-id'
            }
          );

          return res.end();
        }

        /*
         * LOGIN
         */
        if (
          url.pathname ===
            '/api/login' &&
          req.method ===
            'POST'
        ) {
          const b =
            await body(req);

          const d =
            load();

          const u =
            d.users.find(
              (x) =>
                x.username ===
                  b.username &&
                x.password ===
                  b.password
            );

          if (!u) {
            return json(
              res,
              401,
              {
                error:
                  'Invalid username or password'
              }
            );
          }

          return json(
            res,
            200,
            {
              username:
                u.username,
              role: u.role,
              employeeId:
                u.employeeId ||
                null
            }
          );
        }

        /*
         * CONFIG
         */
        if (
          url.pathname ===
            '/api/config' &&
          req.method ===
            'GET'
        ) {
          const d =
            load();

          return json(
            res,
            200,
            {
              employees:
                d.employees,
              holidays:
                d.holidays,
              leaves:
                d.leaves,
              shiftRequests:
                d.shiftRequests ||
                [],
              rotation:
                d.rotation
            }
          );
        }

        /*
         * GENERATE ROSTER
         */
        if (
          url.pathname ===
            '/api/generate' &&
          req.method ===
            'POST'
        ) {
          allowed(
            req,
            'admin',
            'manager'
          );

          const d =
            load();

          const b =
            await body(req);

          if (!b.month) {
            return json(
              res,
              400,
              {
                error:
                  'Month is required.'
              }
            );
          }

          const r =
            generateMonth(
              b.month,
              d
            );

          d.rosters[
            b.month
          ] = r;

          save(d);

          return json(
            res,
            200,
            r
          );
        }

        /*
         * GET ROSTER
         */
        if (
          url.pathname.startsWith(
            '/api/roster/'
          ) &&
          req.method ===
            'GET'
        ) {
          const month =
            url.pathname.slice(
              '/api/roster/'.length
            );

          const d =
            load();

          const r =
            d.rosters[month];

          return r
            ? json(
                res,
                200,
                r
              )
            : json(
                res,
                404,
                {
                  error:
                    'Roster not found'
                }
              );
        }

        /*
         * MANUAL ROSTER UPDATE
         */
        if (
          url.pathname ===
            '/api/roster' &&
          req.method ===
            'PUT'
        ) {
          allowed(
            req,
            'admin',
            'manager'
          );

          const d =
            load();

          const r =
            await body(req);

          if (!r.month) {
            return json(
              res,
              400,
              {
                error:
                  'Month is required.'
              }
            );
          }

          r.validation =
            validate(
              r,
              d
            );

          r.stats =
            rosterStats(
              r.assignments,
              r.dates,
              d.employees
            );

          d.rosters[
            r.month
          ] = r;

          save(d);

          return json(
            res,
            200,
            r
          );
        }

        /*
         * CREATE LEAVE REQUEST
         */
        if (
          url.pathname ===
            '/api/leaves' &&
          req.method ===
            'POST'
        ) {
          const d =
            load();

          const b =
            await body(req);

          const eid =
            b.employeeId ||
            employeeId(req);

          if (!eid) {
            return json(
              res,
              400,
              {
                error:
                  'Employee ID is required.'
              }
            );
          }

          if (
            !b.startDate ||
            !b.endDate
          ) {
            return json(
              res,
              400,
              {
                error:
                  'Start date and end date are required.'
              }
            );
          }

          const leave = {
            id:
              crypto.randomUUID(),
            employeeId: eid,
            startDate:
              b.startDate,
            endDate:
              b.endDate,
            reason:
              b.reason || '',
            status:
              'pending',
            createdAt:
              new Date().toISOString()
          };

          d.leaves.push(
            leave
          );

          save(d);

          return json(
            res,
            201,
            leave
          );
        }

        /*
         * APPROVE / REJECT LEAVE
         */
        if (
          url.pathname.startsWith(
            '/api/leaves/'
          ) &&
          req.method ===
            'PATCH'
        ) {
          allowed(
            req,
            'admin',
            'manager'
          );

          const d =
            load();

          const b =
            await body(req);

          const id =
            url.pathname.slice(
              '/api/leaves/'.length
            );

          const leave =
            d.leaves.find(
              (x) =>
                x.id === id
            );

          if (!leave) {
            throw Error(
              'Leave request not found'
            );
          }

          if (
            ![
              'approved',
              'rejected',
              'pending'
            ].includes(
              b.status
            )
          ) {
            return json(
              res,
              400,
              {
                error:
                  'Invalid leave status.'
              }
            );
          }

          leave.status =
            b.status;

          save(d);

          return json(
            res,
            200,
            leave
          );
        }

        /*
         * CREATE SHIFT CHANGE REQUEST
         */
        if (
          url.pathname ===
            '/api/shift-requests' &&
          req.method ===
            'POST'
        ) {
          const d =
            load();

          const b =
            await body(req);

          const eid =
            b.employeeId ||
            employeeId(req);

          if (!eid) {
            return json(
              res,
              400,
              {
                error:
                  'Employee ID is required.'
              }
            );
          }

          if (
            !b.date ||
            !b.currentShift ||
            !b.requestedShift
          ) {
            return json(
              res,
              400,
              {
                error:
                  'Date, current shift and requested shift are required.'
              }
            );
          }

          const validShifts =
            [
              'M',
              'G',
              'E',
              'N'
            ];

          if (
            !validShifts.includes(
              b.currentShift
            ) ||
            !validShifts.includes(
              b.requestedShift
            )
          ) {
            return json(
              res,
              400,
              {
                error:
                  'Invalid shift selected.'
              }
            );
          }

          if (
            b.currentShift ===
            b.requestedShift
          ) {
            return json(
              res,
              400,
              {
                error:
                  'Requested shift must be different from current shift.'
              }
            );
          }

          const request = {
            id:
              crypto.randomUUID(),
            employeeId: eid,
            date: b.date,
            currentShift:
              b.currentShift,
            requestedShift:
              b.requestedShift,
            reason:
              b.reason || '',
            status:
              'pending',
            createdAt:
              new Date().toISOString()
          };

          d.shiftRequests.push(
            request
          );

          save(d);

          return json(
            res,
            201,
            request
          );
        }

        /*
         * GET SHIFT CHANGE REQUESTS
         */
        if (
          url.pathname ===
            '/api/shift-requests' &&
          req.method ===
            'GET'
        ) {
          const d =
            load();

          let requests =
            d.shiftRequests ||
            [];

          /*
           * Employee sees only
           * their own requests.
           */
          if (
            role(req) ===
            'employee'
          ) {
            requests =
              requests.filter(
                (x) =>
                  x.employeeId ===
                  employeeId(req)
              );
          }

          return json(
            res,
            200,
            requests
          );
        }

        /*
         * APPROVE / REJECT SHIFT CHANGE
         */
        if (
          url.pathname.startsWith(
            '/api/shift-requests/'
          ) &&
          req.method ===
            'PATCH'
        ) {
          allowed(
            req,
            'admin',
            'manager'
          );

          const d =
            load();

          const b =
            await body(req);

          const id =
            url.pathname.slice(
              '/api/shift-requests/'.length
            );

          const request =
            (
              d.shiftRequests ||
              []
            ).find(
              (x) =>
                x.id === id
            );

          if (!request) {
            throw Error(
              'Shift change request not found'
            );
          }

          if (
            ![
              'approved',
              'rejected',
              'pending'
            ].includes(
              b.status
            )
          ) {
            return json(
              res,
              400,
              {
                error:
                  'Invalid request status.'
              }
            );
          }

          request.status =
            b.status;

          /*
           * If approved, update
           * the corresponding roster.
           */
          if (
            b.status ===
              'approved'
          ) {
            const roster =
              d.rosters[
                request.date.slice(
                  0,
                  7
                )
              ];

            if (roster) {
              const day =
                roster.assignments[
                  request.date
                ];

              if (day) {
                const assignment =
                  day.find(
                    (x) =>
                      x.employeeId ===
                      request.employeeId
                  );

                if (assignment) {
                  assignment.shift =
                    request.requestedShift;
                }
              }

              roster.validation =
                validate(
                  roster,
                  d
                );

              roster.stats =
                rosterStats(
                  roster.assignments,
                  roster.dates,
                  d.employees
                );
            }
          }

          save(d);

          return json(
            res,
            200,
            request
          );
        }

        /*
         * EMPLOYEE MANAGEMENT
         */
        if (
          url.pathname ===
            '/api/employees' &&
          req.method ===
            'PUT'
        ) {
          allowed(
            req,
            'admin'
          );

          const d =
            load();

          const b =
            await body(req);

          if (
            !Array.isArray(
              b.employees
            )
          ) {
            return json(
              res,
              400,
              {
                error:
                  'employees must be an array.'
              }
            );
          }

          d.employees =
            b.employees;

          save(d);

          return json(
            res,
            200,
            d.employees
          );
        }

        /*
         * STATIC FRONTEND
         */
        const file =
          url.pathname === '/'
            ? 'index.html'
            : url.pathname.slice(1);

        const target =
          path.join(
            PUBLIC,
            file
          );

        if (
          !target.startsWith(
            PUBLIC
          ) ||
          !fs.existsSync(
            target
          )
        ) {
          return json(
            res,
            404,
            {
              error:
                'Not found'
            }
          );
        }

        const types = {
          '.html':
            'text/html',
          '.css':
            'text/css',
          '.js':
            'application/javascript',
          '.json':
            'application/json',
          '.png':
            'image/png',
          '.jpg':
            'image/jpeg',
          '.svg':
            'image/svg+xml'
        };

        res.writeHead(
          200,
          {
            'Content-Type':
              types[
                path.extname(
                  target
                )
              ] ||
              'text/plain'
          }
        );

        fs.createReadStream(
          target
        ).pipe(res);
      } catch (e) {
        console.error(
          e
        );

        json(
          res,
          400,
          {
            error:
              e.message
          }
        );
      }
    }
  );

server.listen(
  process.env.PORT ||
    3000,
  () =>
    console.log(
      'Shift Roster running at http://localhost:3000'
    )
);