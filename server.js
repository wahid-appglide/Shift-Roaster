const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname,
  DATA_FILE = path.join(ROOT, 'data.json'),
  PUBLIC = path.join(ROOT, 'public');

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

const employees = Array.from({ length: 30 }, (_, i) => {
  const code =
    baseCodes[i] || `EMP-${String(i + 1).padStart(2, '0')}`;

  return {
    id: `emp-${i + 1}`,
    code,
    name: code,
    active: true
  };
});

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

    return {
      ...defaults(),
      ...old,
      employees:
        old.employees?.length === 30
          ? old.employees
          : employees,
      leaves: old.leaves || [],
      users: old.users || defaults().users
    };
  } catch {
    return defaults();
  }
}

function save(x) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(x, null, 2)
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
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function monthDates(month) {
  const [y, m] = month.split('-').map(Number);
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

/*
 * Shift requirements
 *
 * Weekend / Company Holiday:
 *   Morning = 1
 *   General = 1
 *   Evening = 1
 *   Night = 2
 *
 * Weekday:
 *   Morning = 1
 *   General = 3
 *   Evening = 2
 *   Night = 2
 */
function requirement(k, holidays) {
  return weekday(k) || holidays.includes(k)
    ? {
        M: 1,
        G: 1,
        E: 1,
        N: 2
      }
    : {
        M: 1,
        G: 3,
        E: 2,
        N: 2
      };
}

function weekKey(k) {
  const d = dateFrom(k);

  d.setDate(
    d.getDate() - (d.getDay() + 6) % 7
  );

  return key(d);
}

function inLeave(eid, date, data) {
  return data.leaves.some(
    l =>
      l.employeeId === eid &&
      l.status === 'approved' &&
      l.startDate <= date &&
      l.endDate >= date
  );
}

function shiftAt(rows, date, eid) {
  return (
    (rows[date] || []).find(
      a => a.employeeId === eid
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

function rosterStats(rows, dates, emps) {
  const stats = Object.fromEntries(
    emps.map(e => [
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
      const s = stats[a.employeeId];

      if (!s) continue;

      if ('MGEN'.includes(a.shift)) {
        s[a.shift]++;
      }

      if (['O', 'L'].includes(a.shift)) {
        s.off[weekKey(d)] =
          (s.off[weekKey(d)] || 0) + 1;
      }
    }
  }

  return stats;
}

function generateMonth(month, data) {
  const ds = monthDates(month);

  const emps = data.employees.filter(
    e => e.active !== false
  );

  if (emps.length < 8) {
    throw Error(
      'At least 8 active employees are required.'
    );
  }

  const rows = {};

  const stats = Object.fromEntries(
    emps.map(e => [
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

  for (let i = 0; i < ds.length; i++) {
    const date = ds[i];

    const req = requirement(
      date,
      data.holidays
    );

    const wk = weekKey(date);

    const weekDates = ds.filter(
      d => weekKey(d) === wk
    );

    const daysLeft =
      weekDates.slice(
        weekDates.indexOf(date)
      ).length;

    rows[date] = [];

    const nonWorking = new Set();

    /*
     * Approved leave
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
          (stats[e.id].off[wk] || 0) + 1;
      }
    }

    /*
     * Recovery after Night shifts
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
          (stats[e.id].off[wk] || 0) + 1;
      }
    }

    /*
     * Reserve enough weekly offs
     *
     * Two weekly offs per employee.
     */
    const completeWeek =
      weekDates.length === 7;

    const offTarget = completeWeek
      ? Math.ceil((emps.length * 2) / 7)
      : 0;

    const offPool = emps
      .filter(
        e => !nonWorking.has(e.id)
      )
      .sort(
        (a, b) =>
          (stats[a.id].off[wk] || 0) -
            (stats[b.id].off[wk] || 0) ||
          a.code.localeCompare(b.code)
      );

    const mandatory = completeWeek
      ? offPool.filter(
          e =>
            (stats[e.id].off[wk] || 0) +
              daysLeft <=
            2
        )
      : [];

    const desired = Math.max(
      offTarget,
      mandatory.length
    );

    for (const e of offPool.slice(
      0,
      desired
    )) {
      rows[date].push({
        employeeId: e.id,
        shift: 'O'
      });

      nonWorking.add(e.id);

      stats[e.id].off[wk] =
        (stats[e.id].off[wk] || 0) + 1;
    }

    const assigned =
      new Set(nonWorking);

    /*
     * Assign Night, Morning and Evening.
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
            e => !assigned.has(e.id)
          )
          .filter(
            e =>
              shift !== 'N' ||
              !recoveryNeeded(
                rows,
                ds,
                i,
                e.id
              )
          );

        /*
         * Maximum 3 consecutive Night shifts.
         */
        if (shift === 'N') {
          pool = pool.filter(e => {
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
          });
        }

        if (!pool.length) {
          throw Error(
            `No eligible employee for ${SHIFT_NAMES[shift]} on ${date}.`
          );
        }

        pool.sort(
          (a, b) => {
            const aa = stats[a.id];
            const bb = stats[b.id];

            const bonus =
              weekday(date) ||
              data.holidays.includes(
                date
              );

            return (
              (aa[shift] -
                bb[shift]) ||
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
          data.holidays.includes(date)
        ) {
          stats[e.id].holiday++;
        }
      }
    }

    /*
     * GENERAL SHIFT LOGIC
     *
     * Weekend / Company Holiday:
     *   Exactly ONE employee gets General.
     *   Everyone else gets Weekly Off.
     *
     * Weekday:
     *   Every remaining employee gets General.
     */
    const isWeekendOrHoliday =
      weekday(date) ||
      data.holidays.includes(date);

    if (isWeekendOrHoliday) {
      /*
       * Find employees who are still unassigned.
       */
      const generalPool = emps
        .filter(
          e => !assigned.has(e.id)
        )
        .sort(
          (a, b) => {
            const aa = stats[a.id];
            const bb = stats[b.id];

            /*
             * Give General to the employee
             * who has fewer General shifts.
             *
             * Code is used as a tie-breaker.
             */
            return (
              (aa.G - bb.G) ||
              a.code.localeCompare(
                b.code
              )
            );
          }
        );

      /*
       * EXACTLY ONE GENERAL EMPLOYEE
       */
      if (generalPool.length > 0) {
        const e = generalPool[0];

        rows[date].push({
          employeeId: e.id,
          shift: 'G'
        });

        stats[e.id].G++;

        assigned.add(e.id);
      }

      /*
       * Everyone else is Weekly Off.
       */
      for (const e of emps) {
        if (!assigned.has(e.id)) {
          rows[date].push({
            employeeId: e.id,
            shift: 'O'
          });

          stats[e.id].off[wk] =
            (stats[e.id].off[wk] || 0) +
            1;

          assigned.add(e.id);
        }
      }
    } else {
      /*
       * WEEKDAY
       *
       * Remaining employees become General.
       */
      for (const e of emps) {
        if (!assigned.has(e.id)) {
          rows[date].push({
            employeeId: e.id,
            shift: 'G'
          });

          stats[e.id].G++;

          assigned.add(e.id);
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
    validate(roster, data);

  roster.stats =
    rosterStats(
      rows,
      ds,
      emps
    );

  return roster;
}

function validate(roster, data) {
  const issues = [];

  const emps =
    data.employees.filter(
      e => e.active !== false
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

    const seen = new Set();

    const req =
      requirement(
        d,
        data.holidays
      );

    for (const a of rows[d] || []) {
      if (
        seen.has(a.employeeId)
      ) {
        issues.push(
          `${d}: ${a.employeeId} has more than one assignment.`
        );
      }

      seen.add(a.employeeId);

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
     * Required Special shifts
     */
    for (const s of SPECIAL) {
      if (
        actual[s] < req[s]
      ) {
        issues.push(
          `${d}: ${SHIFT_NAMES[s]} coverage is short by ${
            req[s] - actual[s]
          }.`
        );
      }
    }

    /*
     * General validation
     */
    if (
      weekday(d) ||
      data.holidays.includes(d)
    ) {
      /*
       * Weekend / Holiday must have
       * EXACTLY ONE General employee.
       */
      if (actual.G !== 1) {
        issues.push(
          `${d}: Weekend/company holiday must have exactly 1 General employee, but has ${actual.G}.`
        );
      }
    } else {
      /*
       * Weekday requires at least
       * the configured number of General employees.
       */
      if (
        actual.G < req.G
      ) {
        issues.push(
          `${d}: General coverage is short by ${
            req.G - actual.G
          }.`
        );
      }
    }
  }

  /*
   * Employee recovery and weekly-off validation.
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
        !['O', 'L', 'N'].includes(s)
      ) {
        issues.push(
          `${e.code}: recovery rest missing on ${ds[i]}.`
        );
      }
    }

    /*
     * Minimum two off-days per complete week.
     */
    for (
      const wk of [
        ...new Set(
          ds.map(weekKey)
        )
      ]
    ) {
      const days =
        ds.filter(
          d => weekKey(d) === wk
        );

      if (days.length === 7) {
        const off =
          days.filter(
            d =>
              ['O', 'L'].includes(
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

function role(req) {
  return (
    req.headers['x-role'] ||
    'employee'
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

function json(
  res,
  status,
  x
) {
  res.writeHead(
    status,
    {
      'Content-Type':
        'application/json'
    }
  );

  res.end(
    JSON.stringify(x)
  );
}

function body(req) {
  return new Promise(
    (ok, no) => {
      let s = '';

      req.on(
        'data',
        x => (s += x)
      );

      req.on(
        'end',
        () => {
          try {
            ok(
              s
                ? JSON.parse(s)
                : {}
            );
          } catch (e) {
            no(e);
          }
        }
      );
    }
  );
}

const server =
  http.createServer(
    async (
      req,
      res
    ) => {
      const url = new URL(
        req.url,
        'http://local'
      );

      try {
        /*
         * LOGIN
         */
        if (
          url.pathname ===
            '/api/login' &&
          req.method === 'POST'
        ) {
          const b =
            await body(req);

          const u =
            load().users.find(
              x =>
                x.username ===
                  b.username &&
                x.password ===
                  b.password
            );

          return u
            ? json(
                res,
                200,
                {
                  username:
                    u.username,
                  role: u.role,
                  employeeId:
                    u.employeeId
                }
              )
            : json(
                res,
                401,
                {
                  error:
                    'Invalid username or password'
                }
              );
        }

        /*
         * CONFIG
         */
        if (
          url.pathname ===
            '/api/config' &&
          req.method === 'GET'
        ) {
          const d = load();

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
          req.method === 'POST'
        ) {
          allowed(
            req,
            'admin',
            'manager'
          );

          const d = load();

          const b =
            await body(req);

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
          req.method === 'GET'
        ) {
          const r =
            load().rosters[
              url.pathname.slice(
                12
              )
            ];

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
         * UPDATE ROSTER
         */
        if (
          url.pathname ===
            '/api/roster' &&
          req.method === 'PUT'
        ) {
          allowed(
            req,
            'admin',
            'manager'
          );

          const d = load();

          const r =
            await body(req);

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
         * CREATE LEAVE
         */
        if (
          url.pathname ===
            '/api/leaves' &&
          req.method === 'POST'
        ) {
          const d = load();

          const b =
            await body(req);

          d.leaves.push({
            id: crypto.randomUUID(),
            employeeId:
              b.employeeId,
            startDate:
              b.startDate,
            endDate:
              b.endDate,
            reason:
              b.reason || '',
            status:
              'pending'
          });

          save(d);

          return json(
            res,
            201,
            d.leaves.at(-1)
          );
        }

        /*
         * UPDATE LEAVE
         */
        if (
          url.pathname.startsWith(
            '/api/leaves/'
          ) &&
          req.method === 'PATCH'
        ) {
          allowed(
            req,
            'admin',
            'manager'
          );

          const d = load();

          const b =
            await body(req);

          const l =
            d.leaves.find(
              x =>
                x.id ===
                url.pathname.slice(
                  12
                )
            );

          if (!l) {
            throw Error(
              'Leave request not found'
            );
          }

          l.status =
            b.status;

          save(d);

          return json(
            res,
            200,
            l
          );
        }

        /*
         * UPDATE EMPLOYEES
         */
        if (
          url.pathname ===
            '/api/employees' &&
          req.method === 'PUT'
        ) {
          allowed(
            req,
            'admin'
          );

          const d = load();

          const b =
            await body(req);

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
         * SERVE FRONTEND
         */
        const file =
          url.pathname === '/'
            ? 'index.html'
            : url.pathname.slice(
                1
              );

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
            'application/javascript'
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
