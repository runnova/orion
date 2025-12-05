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
        const exists = window.parent.roturExtension?.friends.list.includes(this.name) || false;
        const actions = [
            { icon: 'person', text: 'View profile', fn: () => window.parent.launchSideBarApp('profile', { name: this.name }) },
            exists
                ? { icon: 'person_remove', text: 'Remove friend', fn: async () => {
                    if (await window.parent.justConfirm("Remove " + this.name + "as friend?")) {
                        window.parent.roturExtension.removeFriend({ FRIEND: this.name });
                    } else {
                        window.parent.toast("You kept them as a friend!")
                    }
                } }
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

document.addEventListener("DOMContentLoaded", async () => {

    let localObj = {}, obj = {}, list = [];

    async function renderContactsList() {
        container.innerHTML = ``;
        localObj = window.parent.settings.get("contacts_list") || {};

        if (Object.keys(localObj).length > 0) {
            obj = { ...localObj };
            list = Object.keys(obj);
        } else {
            list = JSON.parse(await window.parent.roturExtension.getFriendList());
            window.parent.toast("Added " + list.length + " friends from Rotur");
            list.forEach(f => {
                obj[f] = { imgSrc: "https://avatars.rotur.dev/" + f, note: "Rotur account" };
            });
        }

        const renderContact = f => {
            obj[f] = obj[f] || { imgSrc: "https://avatars.rotur.dev/" + f, note: "Rotur account" };
            new ContactToggle(container, { imgSrc: obj[f].imgSrc, name: f, note: obj[f].note });
        };

        list.forEach(renderContact);
        window.parent.settings.set("contacts_list", obj);
    }

    renderContactsList();

    window.deleteContact = (name) => {
        if (obj[name]) {
            delete obj[name];
            window.parent.settings.set("contacts_list", obj);
            renderContactsList();
        }
    };

    window.editNote = async (name) => {
        if (obj[name]) {
            let newNote = await window.parent.ask("Enter a new note for " + name);
            obj[name].note = newNote;
            window.parent.settings.set("contacts_list", obj);
            renderContactsList();
        }
    };
});

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