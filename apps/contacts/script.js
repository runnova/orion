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
        let pinnedNames = window.parent.settings.get("contacts_pinned_list");

        this.pinBtn = document.createElement('div')
        this.pinBtn.className = 'gobtn material-symbols-rounded'
        if (!pinnedNames.includes(name)) {
            this.pinBtn.textContent = 'keep';
            this.pinBtn.onclick = () => {
                pinnedNames.push(name);
                window.parent.settings.set("contacts_pinned_list", pinnedNames);
                renderContactsList();
            }
        } else {
            this.pinBtn.textContent = 'keep_off';
            this.pinBtn.onclick = () => {
                pinnedNames = pinnedNames.filter(x => x !== name);
                window.parent.settings.set("contacts_pinned_list", pinnedNames);
                renderContactsList();
            }
        }
        this.icon = document.createElement('div')
        this.icon.className = 'gobtn material-symbols-rounded'
        this.icon.textContent = 'chevron_right'

        this.head.appendChild(pfp)
        this.head.appendChild(data)
        this.head.appendChild(this.pinBtn)
        this.head.appendChild(this.icon)

        this.more = document.createElement('div')
        this.more.className = 'contactsMoreSec'
        this.more.style.display = 'none'

        this.item.appendChild(this.head)
        this.item.appendChild(this.more)
        if (!pinnedNames.includes(name))
            this.root.appendChild(this.item)
        else
            document.getElementById("pinned").appendChild(this.item)
        this.renderActions()
        this.bind()
    }

    renderActions() {
        this.more.innerHTML = ''
        const exists = window.parent.roturExtension?.friends.list.includes(this.name) || false;
        const actions = [
            { icon: 'person', text: 'View profile', fn: () => window.parent.launchSideBarApp('profile', { name: this.name }) },
            exists
                ? {
                    icon: 'person_remove', text: 'Remove friend', fn: async () => {
                        if (await window.parent.justConfirm("Remove " + this.name + "as friend?")) {
                            window.parent.roturExtension.removeFriend({ FRIEND: this.name });
                        } else {
                            window.parent.toast("You kept them as a friend!")
                        }
                    }
                }
                : { icon: 'person_add', text: 'Add friend', fn: () => window.parent.roturExtension.sendFriendRequest({ FRIEND: this.name }) },
            { icon: 'send_money', text: 'Send credits', fn: () => window.parent.openApp('credits', { name: this.name }) },
            { icon: 'edit_note', text: 'Edit note', fn: () => editNote(this.name) },
            { icon: 'delete_forever', text: 'Delete contact', fn: () => deleteContact(this.name) }
        ];

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

let localObj = {};
let obj = {};

async function importFriendsFromRotur() {
    const list = JSON.parse(await window.parent.roturExtension.getFriendList());
    window.parent.toast("Added " + list.length + " friends from Rotur");
    list.forEach(f => {
        if (!obj[f]) obj[f] = { imgSrc: "https://avatars.rotur.dev/" + f, note: "Rotur account" };
    });
    renderContactsList();
    return obj;
}

async function renderContactsList() {
    container.innerHTML = ``;

    document.getElementById("pinned").innerHTML = '';
    localObj = window.parent.settings.get("contacts_list") || {};
    obj = { ...localObj };

    if (Object.keys(obj).length === 0) {
        obj = await importFriendsFromRotur();
    }

    let list = Object.keys(obj).sort((a, b) => a.localeCompare(b));

    let current = "";
    var pinnedNames = window.parent.settings.get("contacts_pinned_list");
    if (pinnedNames.length < 1) {
        document.getElementById("pinned").innerHTML = `
                <div class="nothingtext">No pinned contacts</div>`;
    }
    list.forEach(f => {
        if (!pinnedNames.includes(f)) {
            const letter = f[0].toUpperCase();
            if (letter !== current) {
                current = letter;
                const h = document.createElement("div");
                h.textContent = current;
                h.className = "contact-header";
                container.appendChild(h);
            }
        }

        if (!obj[f].imgSrc) obj[f].imgSrc = "https://avatars.rotur.dev/" + f;
        new ContactToggle(container, { imgSrc: obj[f].imgSrc, name: f, note: obj[f].note });
    });

    window.parent.settings.set("contacts_list", obj);
}

renderContactsList();

window.deleteContact = name => {
    if (obj[name]) {
        delete obj[name];
        window.parent.settings.set("contacts_list", obj);
        renderContactsList();
    }
};

window.editNote = async name => {
    if (obj[name]) {
        let newNote = await window.parent.ask("Enter a new note for " + name);
        obj[name].note = newNote;
        window.parent.settings.set("contacts_list", obj);
        renderContactsList();
    }
};

var mainSearchBox = document.getElementById("usersearchbar");
function makeSearch() {
    let q = mainSearchBox.value;
    if (q.length > 0) {
        window.parent.launchSideBarApp('profile', { name: q })
    }
}
mainSearchBox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        makeSearch();
    }
});

function greenflag(myWindow) {
    if (myWindow && myWindow.data.type == "addc") {
        let currentUser = myWindow.data.name;
        const s = new Date().toISOString();
        obj[currentUser] = { imgSrc: "https://avatars.rotur.dev/" + currentUser, note: "Added " + s };
        window.parent.settings.set("contacts_list", obj);
        renderContactsList();
    }
}

async function renderSearchedList() {
    const q = document.getElementById("usersearchbar").value.toLowerCase();
    if (q == "") {
        document.getElementById("pinned").style.display = "block";
        document.getElementById("pinnedHeader").style.display = "block";
        renderContactsList();
    } else {
        document.getElementById("pinned").style.display = "none";
        document.getElementById("pinnedHeader").style.display = "none";

        const container = document.getElementById("contactsList");
        const localObj = window.parent.settings.get("contacts_list") || {};
        const obj = { ...localObj };
        const list = Object.keys(obj).filter(n => n.toLowerCase().includes(q));
        list.sort((a, b) => a.localeCompare(b)).forEach(f => {
            if (!obj[f].imgSrc) obj[f].imgSrc = "https://avatars.rotur.dev/" + f;
            new ContactToggle(container, { imgSrc: obj[f].imgSrc, name: f, note: obj[f].note });
        });
    }
}

document.getElementById("usersearchbar").addEventListener("keyup", renderSearchedList);