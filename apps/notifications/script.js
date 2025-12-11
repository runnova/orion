var loader = document.getElementById("glloader");
loader.style.display = "flex";

function greenflag() {
    const notifUrl = "https://api.rotur.dev/notifications?auth=" + window.parent.roturExtension.getToken() + "&after=1000";
    const notifsPromise = fetch(notifUrl).then(r => r.json());
    const txsPromise = Promise.resolve(window.parent.roturExtension.getTransactions());

    Promise.all([notifsPromise, txsPromise]).then(([notifs, txs]) => {
        txs = JSON.parse(txs);
        const combined = [];

        notifs.forEach(n => {
            combined.push({
                type: n.type,
                user: n.user || n.follower || (n.followers?.length ? n.followers[n.followers.length - 1] : "someone"),
                content: n.content,
                timestamp: n.timestamp,
                kind: "notif"
            });
        });

        txs.forEach(t => {
            combined.push({
                type: t.type,
                user: t.user,
                amount: t.amount,
                note: t.note,
                timestamp: t.time,
                kind: "tx"
            });
        });

        combined.sort((a, b) => b.timestamp - a.timestamp);

        const c = document.querySelector("#notifs");
        c.innerHTML = "";

        combined.forEach(item => {
            const el = document.createElement("div");
            el.className = "sing_notif";

            const img = document.createElement("img");
            img.src = "https://avatars.rotur.dev/" + item.user;

            const data = document.createElement("div");
            data.className = "data";

            const name = document.createElement("strong");
            name.textContent = item.user;


            const text = document.createElement("span");
            if (item.kind === "notif") {
                if (item.type === "follow") text.textContent = " followed you";
                else if (item.type === "reply") text.textContent = ` replied "${item.content}" on your post`;
                else if (item.type === "repost") text.textContent = " reposted";
                else text.textContent = item.type;
            } else {
                text.textContent = `${(item.type == "in") ? "paid you" : ((item.type == "tax") ? "paid" : "recieved a transfer of")} ${item.amount} ${(item.type == "tax") ? "in taxes" : ""} (${item.note})`;
            }

            data.appendChild(name);
            data.appendChild(text);
            
            const timetext = document.createElement("span");
            timetext.textContent = timeSince(item.timestamp);

            data.appendChild(timetext);

            el.appendChild(img);
            el.appendChild(data);

            c.appendChild(el);
        });

        loader.style.display = "none";
    });
}



function timeSince(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
    ];
    for (const interval of intervals) {
        const count = Math.floor(seconds / interval.seconds);
        if (count >= 1) return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
    return "Just now";
}