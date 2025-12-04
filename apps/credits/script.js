const rtrElements = document.querySelectorAll('.rtr');
const rtrsvg = document.querySelector('#rtrsvg');

rtrElements.forEach(element => {
    const clone = rtrsvg.cloneNode(true);
    element.appendChild(clone);
});

var payment_screen = document.getElementById("paymentscreen");
var payment_screen_un = document.getElementById("sendmoneyusrchip");
var target_un_inp = document.getElementById("usersearchbar");
var payment_screen_amt = document.getElementById("sendmoneyvalue");
var payment_screen_note = document.getElementById("sendmoneynote");

function recalculatepaycheck() {
    let element = document.getElementById("totalpaymentfr");
    element.innerText = parseFloat(payment_screen_amt.value) + 1;
}
(async () => {
    const rawData = await window.parent.roturExtension.getTransactions();
    const currentBalance = await window.parent.roturExtension.getBalance();

    document.getElementById("accbaldisp").innerText = currentBalance;

    const transactions = JSON.parse(rawData);
    let totalGain = 0;
    let totalLoss = 0;

    transactions.sort((a, b) => {
        const ta = a.time ? a.time : 0;
        const tb = b.time ? b.time : 0;
        return ta - tb;
    });

    const dataPoints = [];
    let runningBalance = currentBalance;

    for (let i = transactions.length - 1; i >= 0; i--) {
        const t = transactions[i];
        let time = '';
        let user = '';
        let amount = 0;
        let note = '';
        let timestamp = 0;

        if (typeof t === 'string') {
            const m = t.match(/([-+]?\d*\.?\d+)/);
            if (m) {
                amount = parseFloat(m[0]);
                note = t.replace(m[0], '').trim();
                if (amount > 0) totalGain += amount;
                else totalLoss += Math.abs(amount);
                runningBalance -= amount;
                dataPoints.unshift({
                    time: '',
                    timestamp: Date.now(),
                    user: 'unknown',
                    amount,
                    note,
                    balance: runningBalance
                });
            }
        } else if (typeof t === 'object' && t) {
            amount = t.amount || 0;
            const type = t.type;
            const signed = type === 'out' ? -amount : amount;
            timestamp = t.time || 0;
            time = timestamp ? new Date(timestamp).toLocaleString() : '';
            user = t.user || 'unknown';
            note = t.note || '';
            if (type === 'in') totalGain += amount;
            else if (type === 'out') { totalLoss += amount; };
            runningBalance -= signed;
            dataPoints.unshift({
                time,
                timestamp,
                user,
                amount: signed,
                note,
                balance: runningBalance
            });
        }
    }

    const table = document.createElement('table');
    const header = document.createElement('tr');
    ['Time', 'User', 'Amount', 'Reason', 'Balance'].forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        header.appendChild(th);
    });
    table.appendChild(header);

    [...dataPoints].sort((a, b) => b.timestamp - a.timestamp).forEach(r => {
        const tr = document.createElement('tr');
        [r.time, r.user, r.amount, r.note, r.balance].forEach((v, i) => {
            const td = document.createElement('td');
            td.textContent = v;
            if (i === 2) {
                if (Number(v) > 0) { td.style.color = '#5be45b' }
                else { td.style.color = '#d44343' };
            } else if (i === 1) {
                td.innerHTML = `<span class="un">${v}</span>`;
                td.onclick = () => {
                    window.parent.launchSideBarApp('profile', { name: v });
                }
            }
            tr.appendChild(td);
        });
        table.appendChild(tr);
    });

    const container = document.querySelector('#transactionList');
    container.innerHTML = '';
    container.appendChild(table);

    const ctx = document.getElementById('transactionChart').getContext('2d');
    const graphLabels = dataPoints.map(d => `${d.user}: ${d.amount}`);
    const graphData = dataPoints.map(d => d.balance);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: graphLabels,
            datasets: [{
                label: 'Balance Over Time',
                data: graphData,
                borderColor: "white",
                backgroundColor: window.parent.accent,
                tension: 0.2,
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: { title: { display: true, text: 'Transaction' }, ticks: { maxRotation: 90, minRotation: 45 } },
                y: { title: { display: true, text: 'Balance' } }
            }
        }
    });

    function filterDataByRange(range, data) {
        const now = new Date();
        return data.filter(d => {
            const t = d.timestamp ? new Date(d.timestamp) : null;
            if (!t) return false;
            if (range === 'all_time') return true;
            if (range === 'this_week') {
                const start = new Date(now); start.setDate(now.getDate() - now.getDay());
                return t >= start;
            }
            if (range === 'last_week') {
                const start = new Date(now); start.setDate(now.getDate() - now.getDay() - 7);
                const end = new Date(start); end.setDate(start.getDate() + 7);
                return t >= start && t < end;
            }
            if (range === 'this_month') {
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                return t >= start;
            }
            if (range === 'last_month') {
                const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                const end = new Date(now.getFullYear(), now.getMonth(), 1);
                return t >= start && t < end;
            }
            if (range === 'this_year') {
                const start = new Date(now.getFullYear(), 0, 1);
                return t >= start;
            }
        });
    }

    function updateGainLoss(range) {
        const filtered = filterDataByRange(range, dataPoints);
        const gain = filtered.filter(d => d.amount > 0).reduce((a, b) => a + b.amount, 0);
        const loss = filtered.filter(d => d.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);
        let pct = loss === 0 ? 100 : ((gain - loss) / loss) * 100;
        document.getElementById("accgainlossdisp").textContent = pct.toFixed(1) + "%";
        let gainLossIcon = document.getElementById("gainorloss");
        if (gain >= loss) {
            gainLossIcon.textContent = 'arrow_upward';
            gainLossIcon.style.backgroundColor = 'rgb(81,165,81)';
        } else {
            gainLossIcon.textContent = 'arrow_downward';
            gainLossIcon.style.backgroundColor = 'rgb(165,81,81)';
        }
    }

    function updateFlow(range) {
        const filtered = filterDataByRange(range, dataPoints);
        const inflow = filtered.filter(d => d.amount > 0).reduce((a, b) => a + b.amount, 0);
        const outflow = filtered.filter(d => d.amount < 0).reduce((a, b) => a + Math.abs(b.amount), 0);
        document.getElementById('flow-in').textContent = inflow;
        document.getElementById('flow-out').textContent = outflow;
    }

    document.getElementById('gainloss-range').addEventListener('change', e => updateGainLoss(e.target.value));
    document.getElementById('flow-range').addEventListener('change', e => updateFlow(e.target.value));

    updateGainLoss('this_week');
    updateFlow('this_week');

    function aggregateTotals(data) {
        const payers = {};
        const receivers = {};

        data.forEach(d => {
            if (d.amount > 0) {
                if (!payers[d.user]) payers[d.user] = 0;
                payers[d.user] += d.amount;
            }
            if (d.amount < 0) {
                if (!receivers[d.user]) receivers[d.user] = 0;
                receivers[d.user] += Math.abs(d.amount);
            }
        });

        return { payers, receivers };
    }


    function topFive(obj) {
        const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
        const top = entries.slice(0, 5);
        const rest = entries.slice(5).reduce((a, b) => a + b[1], 0);
        if (rest > 0) top.push(["others", rest]);
        return top;
    }

    const { payers, receivers } = aggregateTotals(dataPoints);

    const topPayers = topFive(payers);
    new Chart(document.getElementById("topPayersChart").getContext("2d"), {
        type: 'pie',
        data: {
            labels: topPayers.map(e => e[0]),
            datasets: [{
                data: topPayers.map(e => e[1]),
                backgroundColor: ['#e74c3c', '#c0392b', '#d35400', '#e67e22', '#f1c40f', '#7f8c8d']
            }]
        },
        options: {
            responsive: true
        }
    });

    const topReceivers = topFive(receivers);
    new Chart(document.getElementById("topReceiversChart").getContext("2d"), {
        type: 'bar',
        data: {
            labels: topReceivers.map(e => e[0]),
            datasets: [{
                label: 'Received',
                data: topReceivers.map(e => e[1]),
                backgroundColor: '#2ecc71'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false }
            }
        }
    });

    function weekStart(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        x.setDate(x.getDate() - x.getDay());
        return x;
    }

    function buildVolatility(data) {
        const now = new Date();
        const w0 = weekStart(now);
        const w1 = new Date(w0); w1.setDate(w0.getDate() - 7);
        const w2 = new Date(w0); w2.setDate(w0.getDate() - 14);

        const ranges = [
            [w2, new Date(w1)],
            [w1, new Date(w0)],
            [w0, now]
        ];

        return ranges.map(([s, e]) => {
            return data.filter(d => {
                const t = new Date(d.timestamp);
                return t >= s && t < e;
            }).reduce((a, b) => a + Math.abs(b.amount), 0);
        });
    }

    const vol = buildVolatility(dataPoints);

    new Chart(document.getElementById("volatilityChart"), {
        type: 'bar',
        data: {
            labels: ["Week 3", "Week 2", "Week 1"],
            datasets: [{
                data: vol,
                backgroundColor: ['#9b59b6', '#8e44ad', '#6c3483']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            }
        }
    });

    document.getElementById("volatilityChart").style.height = "200px";

    function dayKey(d) {
        const x = new Date(d);
        x.setHours(0, 0, 0, 0);
        return x.toISOString().slice(0, 10);
    }

    function lastNDays(n) {
        const arr = [];
        const now = new Date();
        for (let i = 0; i < n; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            arr.push(dayKey(d));
        }
        return arr.reverse();
    }

    function sumByDay(data, days) {
        const map = {};
        days.forEach(k => map[k] = 0);
        data.forEach(d => {
            const k = dayKey(d.timestamp);
            if (map[k] !== undefined) map[k] += d.amount;
        });
        return days.map(k => map[k]);
    }

    const daysThis = lastNDays(7);
    const daysLast = lastNDays(14).slice(0, 7);

    const dataThisWeek = sumByDay(
        dataPoints.filter(d => new Date(d.timestamp) >= new Date(daysThis[0])),
        daysThis
    );

    const dataLastWeek = sumByDay(
        dataPoints.filter(d => {
            const t = new Date(d.timestamp);
            return t >= new Date(daysLast[0]) && t <= new Date(daysLast[6]);
        }),
        daysLast
    );

    new Chart(document.getElementById("weekCompareChart").getContext("2d"), {
        type: "line",
        data: {
            labels: daysThis,
            datasets: [
                {
                    label: "This Week",
                    data: dataThisWeek,
                    borderColor: "#27ae60",
                    backgroundColor: window.parent.accent,
                    fill: true,
                    tension: 0.2
                },
                {
                    label: "Last Week",
                    data: dataLastWeek,
                    borderColor: "#bdc3c7",
                    borderDash: [6, 3],
                    tension: 0.2
                }
            ]
        },
        options: {
            responsive: true
        }
    }); function aggregateReasonTypes(data) {
        const map = {};
        data.forEach(d => {
            const k = d.note || "unknown";
            if (!map[k]) map[k] = { sum: 0, type: d.amount < 0 ? "to" : "from" };
            map[k].sum += Math.abs(d.amount);
        });
        return map;
    }

    function topReasonsAllTime(data) {
        const map = aggregateReasonTypes(data);
        const arr = Object.entries(map)
            .map(([k, v]) => [k, v.sum, v.type])
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6);
        return arr;
    }

    const r = topReasonsAllTime(dataPoints);

    const colors = r.map(e => {
        return e[2] === "to" ? "#d44343" : "#5be45b";
    });

    new Chart(document.getElementById("topReasonsChart").getContext("2d"), {
        type: "pie",
        data: {
            labels: r.map(e => e[0]),
            datasets: [{
                data: r.map(e => e[1]),
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true
        }
    });



    document.getElementById("pfponnav").src = "https://avatars.rotur.dev/" + window.parent.roturExtension.user.username;
})();

async function makepayment() {
    loader.start();
    let doesexists = await fetch(`https://social.rotur.dev/profile?name=${target_un_inp.value}&limit=1`);
    doesexists = await doesexists.text();
    loader.stop();
    if (JSON.parse(doesexists)?.error) {
        window.parent.toast("There's no such user");
        return;
    }
    openScreen("paymentscreen")
    document.querySelector("#paymentscreen > .nothing").style.display = "none";
    document.querySelector("#paymentscreen > .active_payment").style.display = "flex";
    payment_screen_un.innerText = target_un_inp.value;
    payment_screen_amt.value = '';
    payment_screen_amt.focus();
}

function cancelpayment() {
    openScreen("home");
    document.querySelector("#paymentscreen > .nothing").style.display = "flex";
    document.querySelector("#paymentscreen > .active_payment").style.display = "none";
}

var loader_element = document.getElementById("loaderElement")

var loader = {
    start: () => {
        loader_element.style.height = "6px";
        loader_element.style.opacity = "1";
    },
    stop: () => {
        loader_element.style.height = "0px";
        loader_element.style.opacity = "0";
    }
}

function sendmoneyfr() {
    window.parent.roturExtension.transferCurrency({ AMOUNT: Number(payment_screen_amt.value), USER: target_un_inp.value, NOTE: payment_screen_note.value }).then((result) => {
        if (result == "Success") {
            openScreen("donescreen");
            target_un_inp.value = '';
        }
    })
}

function openScreen(id) {
    document.querySelectorAll('#allScreens > .screen').forEach(s => {
        s.style.display = s.id === id ? 'flex' : 'none'
    })

    document.querySelectorAll('.nav_btn').forEach(s => {
        s.classList.remove("active")
    })
    document.querySelectorAll(`[opener='${id}']`)[0].classList.add("active")
}
cancelpayment();