var loader = document.getElementById("glloader");
async function renderProfile(name) {
    console.log(67, name)
    const res = await fetch(`https://api.rotur.dev/profile?name=${encodeURIComponent(name)}&include_posts=0`);
    const data = await res.json();
    document.querySelector('#prof_pfp').src = data.pfp;
    document.querySelector('#prof_name').textContent = data.username;
    document.querySelector('#prof_more').innerHTML = `<a>${data.private ? '<i class="material-symbols-rounded">lock</i> Private' : '<i class="material-symbols-rounded">public</i> Public'}</a> • <a class="${(data.system == "orion") ? 'special' : ''}">${data.system}</a> • <a>${data.pronouns}</a>`;
    document.querySelector('#prof_abtme').innerHTML = escapeHTML(data.bio).replace(/\n/g, '<br>');
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
    const checkBanner = async () => {
        const res = await fetch(data.banner);
        const blob = await res.blob();
        const big = blob.size > 1500;

        const el = document.querySelector('#prof_banner');
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
            adjustHeight();
            URL.revokeObjectURL(url);
        };
        img.src = url;

        if (big) {
            el.style.backgroundImage = `url("${url}")`;
            el.style.filter = "blur(0em)";
            el.style.backgroundSize = "contain";
        } else {
            el.style.backgroundImage = `url("${data.pfp}")`;
            el.style.filter = "blur(2em)";
            el.style.backgroundSize = "cover";
        }
        setTimeout(() => {
            adjustHeight();
        }, 1000);
    };


    checkBanner();
    var obj = window.parent.settings.get("contacts_list");
    if (obj && obj[name]) {
        document.getElementById("prof_nte").innerText = obj[name].note;
    } else {
        document.getElementById("prof_nte").parentElement.remove();
    }
    loader.style.display = "none";
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

loader.style.display = "flex";
var currentUser;
function greenflag(myWindow) {
    loader.style.display = "flex";
    console.log(88, myWindow.data)
    if (myWindow) {
        currentUser = myWindow.data.name;
        renderProfile(currentUser);
    } else {
        renderProfile(window.parent.roturExtension.user.username)
    }
}
const profhead = document.querySelector('.profhead');

function adjustHeight() {
    profhead.style.height = `${profhead.scrollHeight - 70}px`;
}

new ResizeObserver(adjustHeight).observe(profhead);

const mo = new MutationObserver(adjustHeight);
mo.observe(profhead, { childList: true, subtree: true, characterData: true });

window.addEventListener('resize', adjustHeight);

var dropdownBtn = document.getElementById("dropdwnbtn");
dropdownBtn.addEventListener("click", () => {
    dropdownBtn.parentElement.classList.toggle("active");
})

window.editNote = async () => {
    let name = currentUser;
    var obj = window.parent.settings.get("contacts_list");
    if (obj && obj[name]) {
        let newNote = await window.parent.ask("Enter a new note for " + name);
        obj[name].note = newNote;
        window.parent.settings.set("contacts_list", obj);
        renderProfile(currentUser);
    }
};

function escapeHTML(str) {
    if (str == null) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}