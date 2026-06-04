const listing = document.getElementById("listing");
const searchInput = document.getElementById("searchInput");
const dialog = document.getElementById("item_preview");

let items = [];
let owned = [];
let active = {};
let currentPreview = null;

function getToken() {
    return window.parent?.roturExtension?.userToken;
}

function getUsername() {
    return window.parent?.roturExtension?.user?.username || "unknown";
}

async function api(path, options = {}) {
    const token = getToken();
    const url = new URL(`https://api.rotur.dev${path}`);
    if (token) url.searchParams.set("auth", token);

    const res = await fetch(url.toString(), {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    return res.json();
}

function getPriceColor(price) {
    const p = Number(price);

    if (p <= 10) {
        const t = p / 10;
        const hue = 120 - (t * 60);
        return `hsl(${hue}, 80%, 45%)`;
    }

    if (p <= 50) {
        const t = (p - 10) / 40;
        const hue = 60 - (t * 60);
        return `hsl(${hue}, 85%, 45%)`;
    }

    return `hsl(0, 85%, 45%)`;
}

function isOwned(id) {
    return owned.some(i => i.id === id);
}

function isActive(item) {
    return active?.[item.cosmetic_type]?.id === item.id;
}

async function loadMine() {
    const data = await api("/cosmetics/mine");
    owned = data.owned_cosmetics || [];
    active = data.active_cosmetics || {};
}

async function loadItems() {
    const res = await fetch("https://api.rotur.dev/cosmetics/shop");
    const data = await res.json();
    items = data.items || [];
    render(items);
}

function render(list) {
    listing.innerHTML = "";

    const username = getUsername();
    const pfpUrl = `https://avatars.rotur.dev/${username}`;

    list.forEach(item => {
        const el = document.createElement("div");
        el.className = "item";

        const ownedFlag = isOwned(item.id);
        const activeFlag = isActive(item);

        if (activeFlag) {
            el.classList.add("item-active");
        } else if (ownedFlag) {
            el.classList.add("item-owned");
        }

        el.innerHTML = `
            <div class="pfp">
                <img src="${pfpUrl}" class="prof_pfp" alt="pfp">
                <img src="${item.image_url}" class="overlay" alt="${item.name}">
            </div>

            <div class="item_body">
                <div class="data">
                    <div class="name">${item.name}</div>
                    <div class="creator">${item.creator}</div>
                </div>

                ${!(ownedFlag || activeFlag) ? `
                    <div class="price">
                        <div class="priceelem"></div>RC
                    </div>
                ` : ""}

                <div class="state">
                    ${activeFlag ? `
                        <div class="icon" title="Active">bolt</div>
                    ` : ownedFlag ? `
                        <div class="icon" title="Owned">check</div>
                    ` : ""}
                </div>
            </div>
        `;

        if (!(ownedFlag || activeFlag)) {
            const priceEl = el.querySelector(".priceelem");
            priceEl.textContent = item.price;
            priceEl.style.color = getPriceColor(item.price);
        }

        el.addEventListener("click", () => openPreview(item));
        listing.appendChild(el);
    });
}

function createButton(text, disabled, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    btn.disabled = disabled;
    btn.addEventListener("click", onClick);
    return btn;
}

async function purchaseItem(id) {
    await api(`/cosmetics/purchase/${id}`, { method: "POST" });
    await loadMine();
    render(items);
}

async function equipItem(id) {
    await api(`/cosmetics/equip/${id}`, { method: "POST" });
    await loadMine();
    render(items);
    if (currentPreview) openPreview(currentPreview);
}

async function unequip(type) {
    await api(`/cosmetics/unequip?type=${type}`, { method: "POST" });
    await loadMine();
    render(items);
    if (currentPreview) openPreview(currentPreview);
}

function openPreview(item) {
    currentPreview = item;

    const username = getUsername();
    const pfpUrl = `https://avatars.rotur.dev/${username}`;

    const previewPfp = dialog.querySelector("#prof_pfp_preview");
    const overlayImg = dialog.querySelector(".overlay");

    previewPfp.src = pfpUrl;
    overlayImg.src = item.image_url;

    dialog.querySelector(".item_type").textContent =
        item.cosmetic_type.charAt(0).toUpperCase() + item.cosmetic_type.slice(1) + " by " + item.creator;

    dialog.querySelector(".name").textContent = item.name;
    dialog.querySelector(".item_desc").textContent = item.description;

    const ul = dialog.querySelector(".other_data");
    ul.innerHTML = "";

    const data = [
        ["Price", item.price],
        ["Type", item.pricing_type],
        ["Earns", item.creator_pct + "%"],
        ["Buyers", item.purchases]
    ];

    data.forEach(([k, v]) => {
        const li = document.createElement("div");

        const keyDiv = document.createElement("div");
        keyDiv.textContent = k;

        const valueDiv = document.createElement("div");
        valueDiv.textContent = v;

        li.appendChild(keyDiv);
        li.appendChild(valueDiv);

        ul.appendChild(li);
    });

    const footer = document.createElement("div");
    footer.className = "actions";

    const ownedFlag = isOwned(item.id);
    const activeFlag = isActive(item);

    if (!ownedFlag) {
        footer.appendChild(
            createButton(`Equip for ${item.price} RC`, false, async (e) => {
                e.stopPropagation();
                await purchaseItem(item.id);
            })
        );
    } else {
        if (activeFlag) {
            footer.appendChild(
                createButton("Unequip", false, async (e) => {
                    e.stopPropagation();
                    await unequip(item.cosmetic_type);
                })
            );
        } else {
            footer.appendChild(
                createButton("Equip", false, async (e) => {
                    e.stopPropagation();
                    await equipItem(item.id);
                })
            );
        }
    }

    let old = dialog.querySelector(".actions");
    if (old) old.remove();

    dialog.querySelector(".detail_part").appendChild(footer);

    if (!dialog.querySelector(".close_btn")) {
        const close = document.createElement("button");
        close.classList.add("close_btn");
        close.classList.add("icon");
        close.textContent = "Close";
        close.addEventListener("click", () => dialog.close());
        dialog.querySelector(".content").appendChild(close);
    }

    dialog.showModal();
}

searchInput.addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.creator.toLowerCase().includes(q)
    );
    render(filtered);
});

(async function init() {
    await loadMine();
    await loadItems();
})();