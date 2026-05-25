var pfplib = {};

function createUserData(from, to, timestamp, clickHandler) {
    const wrapper = document.createElement("div");
    wrapper.className = "mailuserdata";
    wrapper.onclick = clickHandler;

    function formatFullDate(timestamp) {
        return new Date(timestamp).toLocaleString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit"
        });
    }

    wrapper.innerHTML = `
        <div class="mailuseravatar">
            <img
                class="mailuseravatarsrc"
                src="https://avatars.rotur.dev/${from}"
                alt="${from}"
            >
        </div>

        <div class="mailuserdynamics">
            <div class="mailusername" onclick="window.parent.launchSideBarApp('profile', { name: '${from}' }) ">${from}</div>
            <div class="mailtimestamp" onclick="window.parent.launchSideBarApp('profile', { name: '${to}' }) ">To: ${to}</div>
        </div>
        <div style="flex: 1"></div>
            <div class="mailtimestamp">${formatFullDate(timestamp)}</div>
        <div class="printBtn btn" onclick="printMail()">
                        <div class="material-symbols-rounded">print</div>
        </div>
    `;

    pfplib[from] = `https://avatars.rotur.dev/${from}`;

    return wrapper;
}

function formatRelativeTime(timestamp) {
    const now = new Date();
    const date = new Date(timestamp);

    const diff = now - date;

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);

    if (mins < 1) {
        return "Just now";
    }

    if (hours < 24) {
        const sameDay =
            now.getDate() === date.getDate() &&
            now.getMonth() === date.getMonth() &&
            now.getFullYear() === date.getFullYear();

        if (sameDay) {
            return "Today";
        }
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    const isYesterday =
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
        return "Yesterday";
    }

    const sameYear =
        now.getFullYear() === date.getFullYear();

    if (sameYear) {
        return date.toLocaleDateString(undefined, {
            month: "short",
            day: "numeric"
        });
    }

    return date.getFullYear().toString();
}

function parseMarkdown(text) {
    return text
        .replace(/^### (.*)$/gm, "<h3>$1</h3>")
        .replace(/^## (.*)$/gm, "<h2>$1</h2>")
        .replace(/^# (.*)$/gm, "<h1>$1</h1>")
        .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
        .replace(/__(.*?)__/g, "<u>$1</u>")
        .replace(/_(.*?)_/g, "<i>$1</i>")
        .replace(/~~(.*?)~~/g, "<s>$1</s>")
        .replace(/\n/g, "<br>");
}

function renderMailBody(body) {
    const container = document.createElement("div");

    const imageRegex = /\[RAIMG\](.*?)\[\/RAIMG\]/gs;

    let lastIndex = 0;
    let match;

    while ((match = imageRegex.exec(body)) !== null) {
        const textBefore = body.slice(lastIndex, match.index);

        if (textBefore) {
            const text = document.createElement("div");

            text.innerHTML = parseMarkdown(textBefore);

            container.appendChild(text);
        }

        const img = document.createElement("img");

        img.src = match[1].trim();
        img.alt = "Mail image";
        img.style.maxWidth = "100%";
        img.style.display = "block";
        img.style.margin = "8px 0";

        container.appendChild(img);

        lastIndex = imageRegex.lastIndex;
    }

    const remainingText = body.slice(lastIndex);

    if (remainingText) {
        const text = document.createElement("div");

        text.innerHTML = parseMarkdown(remainingText);

        container.appendChild(text);
    }

    return container;
}

async function openMail(mailId, mailMeta) {
    const raw = await window.parent.roturExtension.getMail({
        ID: mailId
    }) || "{}";

    const mailData = JSON.parse(raw);

    document.getElementById("mailTitle").textContent =
        mailData.info?.title || "";

    const mailBody = document.getElementById("mailBody");

    mailBody.innerHTML = "";

    mailBody.appendChild(
        renderMailBody(mailData.body || "")
    );

    const readMailDynamics = document.getElementById("readMailDynamics");

    readMailDynamics.innerHTML = "";

    readMailDynamics.appendChild(
        createUserData(
            mailMeta.from,
            mailMeta.recipient,
            mailMeta.timestamp,
            () => viewprofile(mailMeta.from)
        )
    );
}
async function listMails() {
    const raw = await window.parent.roturExtension.getAllMail();
    const mails = JSON.parse(raw);

    const list = document.querySelector("#mailList");

    list.innerHTML = "";

    const fragment = document.createDocumentFragment();

    for (let index = 0; index < mails.length; index++) {
        const mail = mails[index];

        const mailId = index + 1;

        const relativeTime = formatRelativeTime(mail.timestamp);

        let avatar = pfplib[mail.from];

        if (!avatar) {
            avatar = `https://avatars.rotur.dev/${mail.from}`;
            pfplib[mail.from] = avatar;
        }

        const snippet = (mail.body || "")
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 80);

        const mailElement = document.createElement("div");

        mailElement.className = "singMail";
        mailElement.setAttribute("mail-id", mailId);

        mailElement.innerHTML = `
            <div class="user" onclick="window.parent.launchSideBarApp('profile', { name: '${mail.from}' }) ">
                <img
                    class="mailAvatar"
                    src="${avatar}"
                    alt="${mail.from}"
                    loading="lazy"
                >

                <span>${mail.from}</span>
            </div>

            <div class="text">
                <div class="title">${mail.title}</div>

                <div class="peek">${snippet}</div>
            </div>

            <div class="timestamp">
                ${relativeTime}
            </div>

            <div class="options">
                <div class="material-symbols-rounded">
                    more_vert
                </div>
            </div>
        `;

        mailElement.onclick = () => openMail(mailId, mail);

        fragment.appendChild(mailElement);
    }

    list.appendChild(fragment);
}
listMails();

function printMail() {
    window.print()
}

const mailDraftPage = document.getElementById("mailDraftPage")

const initBtn = mailDraftPage.querySelector(".initBtn")
const draftPage = mailDraftPage.querySelector(".draftPage")

const toInput = document.getElementById("compose_to")
const titleInput = document.getElementById("compose_title")
const messageInput = document.getElementById("compose_message")

const cancelBtn = mailDraftPage.querySelector(".txtbtn")
const sendBtn = mailDraftPage.querySelector(".txtbtn.target")

const errTxt = mailDraftPage.querySelector(".errtxt")

draftPage.style.display = "none"

function resetDraft() {
    toInput.value = ""
    titleInput.value = ""
    messageInput.value = ""
    errTxt.textContent = ""

    draftPage.style.display = "none"
    initBtn.style.display = "flex"
}

function openDraft() {
    initBtn.style.display = "none"
    draftPage.style.display = "flex"
}

initBtn.addEventListener("click", openDraft)

cancelBtn.addEventListener("click", resetDraft)

sendBtn.addEventListener("click", async () => {
    errTxt.textContent = ""
    errTxt.style.color = ""

    try {
        const response = await window.parent.roturExtension.sendMail({
            SUBJECT: titleInput.value.trim(),
            MESSAGE: messageInput.value.trim(),
            TO: toInput.value.trim()
        })

        if (response?.error) {
            errTxt.style.color = "red"
            errTxt.textContent = response.error
            return
        }

        if (typeof response === "string") {
            errTxt.style.color = "green"
            errTxt.textContent = response
            resetDraft()
            return
        }

        errTxt.style.color = "green"
        errTxt.textContent = "Mail sent successfully"
        resetDraft()
    } catch (err) {
        errTxt.style.color = "red"
        errTxt.textContent = err?.message || String(err)
    }
})