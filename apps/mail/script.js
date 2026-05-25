var pfplib = {};

function createUserData(from, timestamp, clickHandler) {
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
            <div class="mailusername">${from}</div>
            <div class="mailtimestamp">${formatFullDate(timestamp)}</div>
        </div>
        <div style="flex: 1"></div>
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

async function openMail(mailId, mailMeta) {
    const raw = await window.parent.roturExtension.getMail({
        ID: mailId
    }) || "{}";

    const mailData = JSON.parse(raw);

    document.getElementById("mailTitle").textContent =
        mailData.info?.title || "";

    document.getElementById("mailBody").textContent =
        mailData.body || "";

    const readMailDynamics = document.getElementById("readMailDynamics");

    readMailDynamics.innerHTML = "";

    readMailDynamics.appendChild(
        createUserData(
            mailMeta.from,
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
            <div class="user">
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

    try {
        const response = await window.parent.roturExtension.sendMail({
            SUBJECT: titleInput.value.trim(),
            MESSAGE: messageInput.value.trim(),
            TO: toInput.value.trim()
        })

        if (response?.error) {
            errTxt.textContent = response.error
            return
        }

        if (typeof response === "string") {
            errTxt.textContent = response
            return
        }

        resetDraft()
    } catch (err) {
        errTxt.textContent = err?.message || String(err)
    }
})