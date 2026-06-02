class TimeUtil {
    static now() {
        return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
}
class MessageGrouper {
    static shouldConnect(prev, curr) {
        if (!prev || !curr) return false
        if (prev.user !== curr.user) return false
        if (curr.reply_to) return false

        const t1 = (prev.timestamp || 0) * 1000
        const t2 = (curr.timestamp || 0) * 1000

        return Math.abs(t2 - t1) < 5 * 60 * 1000
    }
}

class ElementFactory {
    static div(cls, text) {
        const el = document.createElement("div")
        if (cls) el.className = cls
        if (text !== undefined) el.textContent = text
        return el
    }

    static img(cls, src) {
        const el = document.createElement("img")
        el.className = cls
        el.src = src
        return el
    }

    static link(text) {
        const el = document.createElement("a")
        el.textContent = text
        return el
    }

    static icnBtn(icon, text) {
        const el = document.createElement("a");
        el.className = "icon";
        el.setAttribute("data-tooltip", text)
        el.textContent = icon;
        return el
    }
}

class ReplyBuilder {
    static build(message) {
        if (!message.reply_to) return null

        let replyId = null
        let hintedUser = ""

        if (typeof message.reply_to === "object") {
            replyId = message.reply_to.id || null
            hintedUser = message.reply_to.user || ""
        }

        if (!replyId) return null

        const ref =
            message.reply_to_message ||
            state.messages[replyId] ||
            findMessageById(replyId)

        const el = ElementFactory.div("reply-excerpt")
        el.dataset.ref = replyId

        const arrow = ElementFactory.div("rplarrow")
        el.appendChild(arrow)

        if (!ref) {
            el.classList.add("missing")

            const text = document.createElement("span")

            if (hintedUser) {
                const user = document.createElement("span")
                user.className = "reply-user"
                user.style.color = getUserColor(hintedUser)
                user.textContent = "@" + hintedUser

                text.textContent = "Replying to "
                el.append(text, user)
            } else {
                text.textContent = "Replying to unknown message"
                el.appendChild(text)
            }

            return el
        }

        if (!state.messages[replyId]) state.messages[replyId] = ref

        const user = document.createElement("span")
        user.className = "reply-user"
        user.style.color = getUserColor(ref.user || hintedUser || "")
        user.textContent = "@" + (ref.user || hintedUser || "unknown")

        const preview = document.createElement("span")
        preview.className = "reply-preview"
        preview.textContent = stripHtml(ref.content || "").slice(0, 120)

        el.append(user, preview)
        return el
    }
}
class MessageActions {
    static build(message) {
        const actions = ElementFactory.div("msg_actions")

        const reply = ElementFactory.icnBtn("reply", "reply")
        reply.dataset.action = "reply"
        reply.dataset.id = message.id

        const del = ElementFactory.icnBtn("delete", "delete")
        del.dataset.action = "delete"
        del.dataset.id = message.id

        const edit = ElementFactory.icnBtn("edit", "edit")
        edit.dataset.action = "edit"
        edit.dataset.id = message.id

        const copy = ElementFactory.icnBtn("content_copy", "copy")
        copy.dataset.action = "copy"
        copy.dataset.id = message.id

        actions.append(reply, del, edit, copy)
        return actions
    }
}
class MessageBuilder {
    static message({ avatar, username, timeStr, timeout, text, message, prevMessage }) {
        const connected = MessageGrouper.shouldConnect(prevMessage, message)

        const root = ElementFactory.div("msg")
        if (connected) root.classList.add("connected")
        root.setAttribute("data-id", message.id)
        root.dataset.context = "message";
        if (username != state.user.username) { root.classList.add("their") } else {
            root.classList.add("our")
        }

        const data = ElementFactory.div("data")

        if (!connected) {
            const img = ElementFactory.img("pfp", avatar)

            const name = ElementFactory.div("inline bold", username);
            name.style.color = state.users[username]?.color;
            name.dataset.username = username;
            name.classList.add("username");

            const time = ElementFactory.div("time", timeStr)
            const fill = ElementFactory.div("fill")
            const actions = MessageActions.build(message)

            data.append(img, name, fill, actions, time)
        } else {
            root.classList.add("connected")
            const actions = MessageActions.build(message)
            const time = ElementFactory.div("time", timeStr)
            data.append(actions, time)
        }


        let msg = ElementFactory.div("inline p")
        if (text && text.trim()) {
            msg.classList.add("contains_text")
            const parsed = ContentParser.parse(text)
            msg.appendChild(parsed)
        }

        const reply = ReplyBuilder.build(message)
        const attachments = AttachmentBuilder.build(message.attachments)

        if (attachments) msg.append(attachments || "");
        if (connected) {
            root.append(
                msg || "",
                data
            )

        } else {
            root.append(
                reply || "",
                data,
                msg || ""
            )
        }

        return root
    }

    static action(args) {
        return ActionBuilder.build(args)
    }
}

class ActionBuilder {
    static lastAction = null

    static build({ icon, username, action, expiry }) {
        const last = this.lastAction

        if (
            last &&
            last.icon === icon &&
            last.username === username &&
            last.action === action
        ) {
            last.count++
            last.timeNode.textContent = TimeUtil.now()
            last.actNode.textContent = `${action} x${last.count}`

            if (last.timer) clearTimeout(last.timer)

            if (expiry) {
                last.bar.style.animation = "none"
                last.bar.offsetHeight
                last.bar.style.animation = `timeout-shrink ${expiry}ms linear forwards`

                last.timer = setTimeout(() => {
                    last.root.style.overflow = "hidden"
                    last.root.style.transition = "transform 200ms ease, opacity 200ms ease"
                    last.root.style.transform = "scaleY(0)"
                    last.root.style.opacity = "0"

                    setTimeout(() => {
                        last.root.remove()
                        if (this.lastAction === last) this.lastAction = null
                    }, 200)
                }, expiry)
            }

            return last.root
        }

        const root = ElementFactory.div("msg action")
        const data = ElementFactory.div("data")

        const ic = ElementFactory.div("icon", icon || "info_i")
        const name = ElementFactory.div("inline bold")
        name.innerHTML = username

        const act = ElementFactory.div("inline")
        act.innerHTML = action

        username && data.appendChild(name)
        action && data.appendChild(act)

        const time = ElementFactory.div("time", TimeUtil.now())
        root.append(ic, data, time)

        let timer = null
        let bar = null

        if (expiry) {
            bar = ElementFactory.div("timeout-bar")
            root.appendChild(bar)

            bar.style.animation = `timeout-shrink ${expiry}ms linear forwards`

            timer = setTimeout(() => {
                root.style.overflow = "hidden"
                root.style.transition = "transform 200ms ease, opacity 200ms ease"
                root.style.transform = "scaleY(0)"
                root.style.opacity = "0"

                setTimeout(() => {
                    root.remove()
                    if (this.lastAction && this.lastAction.root === root) this.lastAction = null
                }, 200)
            }, expiry)
        }

        this.lastAction = {
            icon,
            username,
            action,
            root,
            timeNode: time,
            actNode: act,
            count: 1,
            timer,
            bar
        }

        return root
    }
}
class ContentParser {
    static imageRegex = /(https?:\/\/[^\s]+)/gi

    static parse(text) {
        const container = document.createElement("div")
        container.innerHTML = text
        this.replaceTextLinks(container)
        return container
    }

    static isLikelyImage(url) {
        return /\.(png|jpg|jpeg|gif|webp|svg|bmp|avif)(\?|$)/i.test(url)
    }

    static createImage(url) {
        const img = document.createElement("img")
        img.src = url
        img.className = "msg_img"
        img.loading = "lazy"
        return img
    }

    static async probe(url) {
        return new Promise(res => {
            const img = new Image()
            img.onload = () => res(true)
            img.onerror = () => res(false)
            img.src = url
        })
    }

    static replaceTextLinks(root) {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
        const nodes = []
        while (walker.nextNode()) nodes.push(walker.currentNode)

        nodes.forEach(node => {
            const matches = [...node.nodeValue.matchAll(this.imageRegex)]
            if (!matches.length) return

            const frag = document.createDocumentFragment()
            let lastIndex = 0

            matches.forEach(match => {
                const url = match[0]
                const start = match.index
                const end = start + url.length

                if (start > lastIndex) {
                    frag.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex, start)))
                }

                if (this.isLikelyImage(url)) {
                    frag.appendChild(this.createImage(url))
                } else {
                    const a = document.createElement("a")
                    a.href = url
                    a.textContent = url

                    this.probe(url).then(ok => {
                        if (ok && a.parentNode) {
                            a.replaceWith(this.createImage(url))
                        }
                    })

                    frag.appendChild(a)
                }

                lastIndex = end
            })

            if (lastIndex < node.nodeValue.length) {
                frag.appendChild(document.createTextNode(node.nodeValue.slice(lastIndex)))
            }

            node.replaceWith(frag)
        })

        const links = root.querySelectorAll("a[href]")
        links.forEach(a => {
            const url = a.href

            if (this.isLikelyImage(url)) {
                a.replaceWith(this.createImage(url))
            } else {
                this.probe(url).then(ok => {
                    if (ok && a.parentNode) {
                        a.replaceWith(this.createImage(url))
                    }
                })
            }
        })
    }
}

class AttachmentBuilder {
    static isImage(att) {
        return att.mime_type && att.mime_type.startsWith("image/")
    }

    static scrollNearestFill(el) {
        const fill = el.closest(".fill")
        if (!fill) return

        requestAnimationFrame(() => {
            fill.scrollTop = fill.scrollHeight
        })
    }

    static build(attachments) {
        if (!attachments || !attachments.length) return null

        const wrap = document.createElement("div")
        wrap.className = "attachments"

        attachments.forEach(att => {
            if (this.isImage(att)) {
                const img = document.createElement("img")

                img.onload = () => {
                    this.scrollNearestFill(img)
                }

                img.src = att.url
                img.className = "msg_img"
                img.loading = "lazy"

                wrap.appendChild(img)
            } else {
                const a = document.createElement("a")
                a.href = att.url
                a.textContent = att.name || "attachment"
                a.target = "_blank"

                wrap.appendChild(a)
            }
        })

        return wrap
    }
}
function renderOnlineUsers() {
    const usersList = document.getElementById("notes");
    usersList.innerHTML = "";

    Object.keys(state.online_users).forEach(username => {
        const status = state.online_users[username]?.status?.text;
        if (!status) return;

        const user = document.createElement("div");
        user.className = "note_user";

        const note = document.createElement("div");
        note.className = "note";
        note.textContent = status;

        const pfp = document.createElement("div");
        pfp.className = "pfp";

        const avatar = document.createElement("img");
        avatar.src = `https://avatars.rotur.dev/${encodeURIComponent(username)}`;
        avatar.alt = "";

        const overlay = document.createElement("img");
        overlay.src = `https://avatars.rotur.dev/.overlay/${encodeURIComponent(username)}`;
        overlay.alt = "";
        overlay.className = "overlay";

        const badge = document.createElement("div");
        badge.className = "online_badge";

        pfp.append(avatar, overlay, badge);

        const name = document.createElement("div");
        name.className = "name";
        name.textContent = username;

        user.append(note, pfp, name);
        usersList.appendChild(user);
    });
}

function renderUsers() {
    const usersList = document.getElementById("users_list");
    usersList.innerHTML = "";

    Object.entries(state.channelsArray).forEach(([username, channel]) => {
        if (channel.type !== "chat") return;

        const userSingle = document.createElement("div");
        userSingle.className = "user_single";

        const pfp = document.createElement("div");
        pfp.className = "pfp";

        const avatar = document.createElement("img");
        avatar.src = `https://avatars.rotur.dev/${channel.name}`;
        avatar.alt = channel.name;

        const overlay = document.createElement("img");
        overlay.src = `https://avatars.rotur.dev/.overlay/${channel.name}`;
        overlay.alt = "";
        overlay.className = "overlay";

        const onlineBadge = document.createElement("div");
        onlineBadge.className = "online_badge";

        pfp.append(avatar, overlay, onlineBadge);

        const data = document.createElement("div");
        data.className = "data";

        const usernameEl = document.createElement("div");
        usernameEl.className = "single_username";
        usernameEl.innerText = channel.name;

        const textEl = document.createElement("div");
        textEl.className = "single_user_text";
        textEl.innerText = channel.desc;

        data.append(usernameEl, textEl);

        userSingle.append(pfp, data);
        usersList.appendChild(userSingle);
        userSingle.addEventListener("click", () => {
            changeChannel(channel.name)
        })
    });
}


function stripHtml(html) {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
}

var settings = {
    queue: Promise.resolve(),

    get: key => {
        const store = localStorage.getItem('orla-store')
        const data = store ? JSON.parse(store) : {}

        if (key === undefined) return data
        if (!(key in data)) return 0
        return data[key]
    },

    set: (key, value) => {
        if (value === undefined) {
            value = key
            key = null
        }

        settings.queue = settings.queue.then(() => {
            const store = localStorage.getItem('orla-store')
            const data = store ? JSON.parse(store) : {}

            if (key === null && typeof value === 'object' && value !== null) {
                Object.assign(data, value)
            } else {
                data[key] = value
            }

            localStorage.setItem('orla-store', JSON.stringify(data))
            return value
        })

        return settings.queue
    }
}

const toFormattedString = (value, indent = 0, seen = new WeakSet()) => {
    const frag = document.createDocumentFragment()
    const pad = (n) => `${n * 12 + 16}px`

    const primitive = (v) => {
        if (typeof v === "string") return `"${v}"`
        if (typeof v === "function") return v.name ? `[Function ${v.name}]` : "[Function]"
        if (typeof v === "symbol") return v.toString()
        if (v instanceof Date) return v.toISOString()
        if (v instanceof RegExp) return v.toString()
        return String(v)
    }

    const preview = (v) => {
        if (v == null || typeof v !== "object") return primitive(v)
        if (seen.has(v)) return "[Circular]"

        if (Array.isArray(v)) {
            if (!v.length) return "[]"
            return `[${preview(v[0])}${v.length > 1 ? ", …" : ""}]`
        }

        const entries = Object.entries(v).filter(([, x]) => x != null)
        if (!entries.length) return "{}"

        const [k, val] = entries[0]
        return `{ ${k}: ${preview(val)}${entries.length > 1 ? ", …" : ""} }`
    }

    const line = (text, level = indent) => {
        const div = document.createElement("div")
        div.style.paddingLeft = pad(level)
        div.textContent = text
        frag.appendChild(div)
    }

    const keyLine = (key, valueText, level) => {
        const div = document.createElement("div")
        div.style.paddingLeft = pad(level)

        const strong = document.createElement("strong")
        strong.textContent = key

        div.appendChild(strong)
        div.appendChild(document.createTextNode(`: ${valueText}`))
        frag.appendChild(div)
    }

    const collapsible = (key, valueText, child, level) => {
        const details = document.createElement("details")
        details.style.paddingLeft = pad(level)

        const summary = document.createElement("summary")

        const strong = document.createElement("strong")
        strong.textContent = key

        summary.appendChild(strong)
        summary.appendChild(document.createTextNode(`: ${valueText}`))
        details.appendChild(summary)

        const body = document.createElement("div")
        body.appendChild(child)
        details.appendChild(body)

        frag.appendChild(details)
    }

    if (value == null) return frag
    if (typeof value !== "object") return line(primitive(value)), frag
    if (seen.has(value)) return line("[Circular]"), frag
    seen.add(value)

    if (Array.isArray(value)) {
        line("[")
        for (const item of value) {
            if (item && typeof item === "object") {
                const child = toFormattedString(item, indent + 2, seen)
                const label = Array.isArray(item) ? preview(item) : preview(item)
                const details = document.createElement("details")
                details.style.paddingLeft = pad(indent + 1)

                const summary = document.createElement("summary")
                summary.textContent = label
                details.appendChild(summary)

                const body = document.createElement("div")
                body.appendChild(child)
                details.appendChild(body)

                frag.appendChild(details)
            } else {
                frag.appendChild(toFormattedString(item, indent + 1, seen))
            }
        }
        line("]")
        return frag
    }

    line("{")

    for (const [key, val] of Object.entries(value)) {
        if (val == null) continue

        if (val && typeof val === "object") {
            collapsible(key, preview(val), toFormattedString(val, indent + 2, seen), indent + 1)
        } else {
            keyLine(key, primitive(val), indent + 1)
        }
    }

    line("}")

    seen.delete(value)
    return frag
}