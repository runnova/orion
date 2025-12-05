async function renderProfile(name) {
    console.log(67, name)
    const res = await fetch(`https://api.rotur.dev/profile?name=${encodeURIComponent(name)}&include_posts=0`);
    const data = await res.json();
    document.querySelector('#prof_pfp').src = data.pfp;
    document.querySelector('#prof_name').textContent = data.username;
    document.querySelector('#prof_more').innerHTML = `<a>${data.private ? '<i class="material-symbols-rounded">lock</i> Private' : '<i class="material-symbols-rounded">public</i> Public'}</a> • <a class="${(data.system == "orion") ? 'special' : ''}">${data.system}</a> • <a>${data.pronouns}</a>`;
    document.querySelector('#prof_abtme').textContent = data.bio.replace(/\n/g, ' ');
    document.querySelector('#prof_crds').textContent = data.currency;
    document.querySelector('#prof_flwrs').textContent = data.followers;
    document.querySelector('#prof_marry').textContent = data.married_to || 'Nobody';
    const badgesContainer = document.querySelector('#prof_badges');
    badgesContainer.innerHTML = '';
    data.badges.forEach(b => {
        const badge = document.createElement('div');
        badge.className = 'sing_badge';

        const canvas = document.createElement('canvas');
        canvas.width = 25;
        canvas.height = 25;
        badge.appendChild(canvas);
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 25 * dpr;
        canvas.height = 25 * dpr;
        canvas.style.width = '25px';
        canvas.style.height = '25px';
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        renderICN(b.icon, canvas);

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = b.name;
        badge.appendChild(tooltip);

        badgesContainer.appendChild(badge);
    });

    const theme = data.theme;
    document.querySelector('#prof_banner').style.background = theme.accent;
}
function renderICN(code, canvas) {
    const ctx = canvas.getContext('2d');
    ctx.save();

    let scale = 1;
    let moveX = 0;
    let moveY = 0;

    ctx.translate(canvas.width / 2 - 2, canvas.height / 2 - 2);
    ctx.lineCap = 'round';
    let last = { x: 0, y: 0 };
    const cmds = code.trim().split(/\s+/);
    let color = '#000', weight = 1;

    const S = v => v * scale;
    const TX = x => S(x + moveX);
    const TY = y => -S(y + moveY);

    for (let i = 0; i < cmds.length; i++) {
        const cmd = cmds[i];

        if (cmd === 'scale') scale = parseFloat(cmds[++i]);
        else if (cmd === 'move') { moveX = parseFloat(cmds[++i]); moveY = parseFloat(cmds[++i]); }

        else if (cmd === 'c') color = cmds[++i];
        else if (cmd === 'w') weight = parseFloat(cmds[++i]) * scale;

        else if (cmd === 'line') {
            const x1 = TX(parseFloat(cmds[++i])), y1 = TY(parseFloat(cmds[++i])),
                x2 = TX(parseFloat(cmds[++i])), y2 = TY(parseFloat(cmds[++i]));
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = weight;
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
            last = { x: parseFloat(cmds[i - 1]), y: parseFloat(cmds[i]) };
        }

        else if (cmd === 'cont') {
            const x = parseFloat(cmds[++i]), y = parseFloat(cmds[++i]);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = weight;
            ctx.moveTo(TX(last.x), TY(last.y));
            ctx.lineTo(TX(x), TY(y));
            ctx.stroke();
            last = { x, y };
        }

        else if (cmd === 'square') {
            const x = parseFloat(cmds[++i]), y = parseFloat(cmds[++i]),
                w = parseFloat(cmds[++i]), h = parseFloat(cmds[++i]);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = weight;
            ctx.strokeRect(TX(x) - S(w / 2), TY(y) - S(h / 2), S(w), S(h));
        }

        else if (cmd === 'dot') {
            const x = TX(parseFloat(cmds[++i])), y = TY(parseFloat(cmds[++i]));
            ctx.beginPath();
            ctx.fillStyle = color;
            ctx.arc(x, y, weight / 2, 0, Math.PI * 2);
            ctx.fill();
        }

        else if (cmd === 'cutcircle') {
            const x0 = parseFloat(cmds[++i]), y0 = parseFloat(cmds[++i]);
            const radius = parseFloat(cmds[++i]) * scale;
            let angleICN = parseFloat(cmds[++i]);
            let filledICN = parseFloat(cmds[++i]);
            let circleAngle = (angleICN * 10) - filledICN;
            let oldX = TX(x0) + Math.sin(circleAngle * Math.PI / 180) * radius;
            let oldY = TY(y0) - Math.cos(circleAngle * Math.PI / 180) * radius;
            const steps = Math.floor(filledICN / 3) + 1;
            ctx.strokeStyle = color;
            ctx.lineWidth = weight;
            for (let j = 0; j < steps - 1; j++) {
                circleAngle += 6;
                const newX = TX(x0) + Math.sin(circleAngle * Math.PI / 180) * radius;
                const newY = TY(y0) - Math.cos(circleAngle * Math.PI / 180) * radius;
                ctx.beginPath();
                ctx.moveTo(oldX, oldY);
                ctx.lineTo(newX, newY);
                ctx.stroke();
                oldX = newX;
                oldY = newY;
            }
        }

        else if (cmd === 'ellipse') {
            const x = parseFloat(cmds[++i]), y = parseFloat(cmds[++i]),
                width = parseFloat(cmds[++i]), hm = parseFloat(cmds[++i]),
                dir = parseFloat(cmds[++i]) * Math.PI / 180;
            ctx.save();
            ctx.translate(TX(x), TY(y));
            ctx.rotate(dir);
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = weight;
            ctx.scale(1, hm);
            ctx.arc(0, 0, S(width / 2), 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }

        else if (cmd === 'curve') {
            const x1 = TX(parseFloat(cmds[++i])), y1 = TY(parseFloat(cmds[++i])),
                x2 = TX(parseFloat(cmds[++i])), y2 = TY(parseFloat(cmds[++i])),
                cx = TX(parseFloat(cmds[++i])), cy = TY(parseFloat(cmds[++i]));
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = weight;
            ctx.moveTo(x1, y1);
            ctx.quadraticCurveTo(cx, cy, x2, y2);
            ctx.stroke();
            last = { x: parseFloat(cmds[i - 1]), y: parseFloat(cmds[i]) };
        }
    }

    ctx.restore();
}


function greenflag(myWindow) {
    console.log(88, myWindow.data)
    if (myWindow) {
        renderProfile(myWindow.data.name);
    } else {
        renderProfile(window.parent.roturExtension.user.username)
    }
}
class ContactToggle {
    constructor(root, { imgSrc, name, note }) {
        this.root = root
        this.name = name

        this.item = document.createElement('div')
        this.item.className = 'sing_contact'

        this.head = document.createElement('div')
        this.head.className = 'contactsDefVisSec'

        const pfp = document.createElement('div')
        pfp.className = 'pfp'
        const img = document.createElement('img')
        img.src = imgSrc
        pfp.appendChild(img)

        const data = document.createElement('div')
        data.className = 'data'
        const nameEl = document.createElement('div')
        nameEl.className = 'name'
        nameEl.textContent = name
        const noteEl = document.createElement('div')
        noteEl.className = 'noteDisplay'
        noteEl.textContent = note
        data.appendChild(nameEl)
        data.appendChild(noteEl)

        this.icon = document.createElement('div')
        this.icon.className = 'gobtn material-symbols-rounded'
        this.icon.textContent = 'chevron_right'

        this.head.appendChild(pfp)
        this.head.appendChild(data)
        this.head.appendChild(this.icon)

        this.more = document.createElement('div')
        this.more.className = 'contactsMoreSec'
        this.more.style.display = 'none'

        this.item.appendChild(this.head)
        this.item.appendChild(this.more)
        this.root.appendChild(this.item)

        this.renderActions()
        this.bind()
    }

    renderActions() {
        this.more.innerHTML = ''
        const exists = window.parent.roturExtension.friends.list.includes(this.name)
        const actions = [
            { icon: 'person', text: 'View profile', fn: () => window.parent.launchSideBarApp('profile', { name: this.name }) },
            exists
                ? { icon: 'person_remove', text: 'Remove friend', fn: () => window.parent.roturExtension.removeFriend({ FRIEND: this.name }) }
                : { icon: 'person_add', text: 'Add friend', fn: () => window.parent.roturExtension.addFriend({ FRIEND: this.name }) },
            { icon: 'send_money', text: 'Send credits', fn: () => console.log('send') },
            { icon: 'Edit_note', text: 'Edit note', fn: () => console.log('edit') },
            { icon: 'delete_forever', text: 'Delete contact', fn: () => console.log('delete') }
        ]

        actions.forEach(a => {
            const btn = document.createElement('div')
            btn.className = 'big btn'
            const icn = document.createElement('div')
            icn.className = 'icn material-symbols-rounded'
            icn.textContent = a.icon
            const span = document.createElement('span')
            span.textContent = a.text
            btn.appendChild(icn)
            btn.appendChild(span)
            btn.onclick = () => {
                a.fn()
                if (a.text === 'Add friend' || a.text === 'Remove friend') this.renderActions()
            }
            this.more.appendChild(btn)
        })
    }

    bind() {
        this.head.addEventListener('click', () => {
            const open = this.more.style.display === 'none'
            this.more.style.display = open ? 'flex' : 'none'
            this.icon.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)'
            this.item.classList.toggle("moresecshw")
        })
    }
}

const container = document.getElementById('contactsList');

document.addEventListener("DOMContentLoaded", async () => {
    let localObj = window.parent.settings.get("contacts_list");
    let obj = {}, list = [];
    if (localObj) {
        obj = localObj;
        list = Object.keys(obj);
    } else {
        list = JSON.parse(await window.parent.roturExtension.getFriendList());
        window.parent.toast("Added " + list.length + " friends from Rotur");
    }
    list.forEach(f => {
        obj[f] = { imgSrc: "https://avatars.rotur.dev/" + f, note: "Rotur account" };
        new ContactToggle(container, { imgSrc: obj[f].imgSrc, name: f, note: obj[f].note });
    });
    if (!localObj) window.parent.settings.set("contacts_list", obj);

});

function makeSearch() {
    let q = document.getElementById("usersearchbar").value;
    if (q.length > 0) {
        window.parent.launchSideBarApp('profile', { name: q })
    }
}