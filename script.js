var iframe = document.getElementById("mainframe");
var appRunner = document.getElementById("appRunner");
var mainHead = document.getElementById("mainHead");
var sidebar = document.getElementById("sidebar");
var loader = document.getElementById("loader");
var persohome = document.getElementById("persohome");
var curtheme = localStorage.getItem("orion-theme") || "default";
var accent = "#39335b";
var oriloaderstatic = document.getElementsByClassName("oriloaderstatic")[0];
var oriloaderstatic2 = document.getElementsByClassName("oriloaderstatic")[1];

var settings = {
	data: JSON.parse(localStorage.getItem("orion_settings") || "{}"),
	get(k) {
		let e = this.data[k];
		if (!e) return undefined;
		if (e.exp && Date.now() > e.exp) {
			delete this.data[k];
			localStorage.setItem("orion_settings", JSON.stringify(this.data));
			return undefined;
		}
		return e.val;
	},
	set(k, v, ttl) {
		this.data[k] = { val: v, exp: ttl ? Date.now() + ttl : null };
		localStorage.setItem("orion_settings", JSON.stringify(this.data));
	}
};

var theme = {
	"default": {
		"--col-bg1": "#101010",
		"--col-bg2": "#171717",
		"--col-bg3": "#262626",
		"--col-bgh": "#43281d",
		"--col-txt1": "#FFFFFF",
		"--col-txth": "#ff946f"
	},
	"light": {
		"--col-bg1": "#fffbf2",
		"--col-bg2": "#ffebbe",
		"--col-bg3": "#e9a35b",
		"--col-bgh": "#ffc160",
		"--col-txt1": "#000000",
		"--col-txth": "#524527"
	},
	"communism": {
		"--col-bg1": "#150000",
		"--col-bg2": "#57000a",
		"--col-bg3": "#ff6464",
		"--col-bgh": "#ff0000",
		"--col-txt1": "#FFFFFF",
		"--col-txth": "#FFFFFF"
	},
	"night shift": {
		"--col-bg1": "#0e0d0a",
		"--col-bg2": "#17110a",
		"--col-bg3": "#231c10",
		"--col-bgh": "#ffdb49",
		"--col-txt1": "#feffd9",
		"--col-txth": "#000000"
	},
	"make it look ai": {
		"--col-bg1": "#000000",
		"--col-bg2": "#0a0a0c",
		"--col-bg3": "#1f1f26",
		"--col-bgh": "#4d59d4",
		"--col-txt1": "#ffffff",
		"--col-txth": "#ffffff",
	},
	"aquamarine+": {
		"--col-bg1": "#101819",
		"--col-bg2": "#182227",
		"--col-bg3": "#253D3E",
		"--col-bgh": "#A9F9EF",
		"--col-txt1": "#C5F3EE",
		"--col-txth": "#203638",
	},
	"ristretto": {
		"--col-bg1": "#191515",
		"--col-bg2": "#2C2525",
		"--col-bg3": "#211C1C",
		"--col-bgh": "#F9CC6C",
		"--col-txt1": "#F2F1F3",
		"--col-txth": "#141414"
	},
	"banks use this": {
		"--col-bg1": "#1a1d6a",
		"--col-bg2": "#3c428d",
		"--col-bg3": "#38485f",
		"--col-bgh": "#00155b",
		"--col-txt1": "#ffffff",
		"--col-txth": "#ff7272"
	},
	"heaven": {
		"--col-bg1": "#ffffff",
		"--col-bg2": "#c4f0ff",
		"--col-bg3": "#73a7ff",
		"--col-bgh": "#225069",
		"--col-txt1": "#313131",
		"--col-txth": "#FFFFFF"
	},
	"hacker": {
		"--col-bg1": "#000000",
		"--col-bg2": "#020802",
		"--col-bg3": "#0e1f13",
		"--col-bgh": "#194209",
		"--col-txt1": "#3cff32",
		"--col-txth": "#95ff7e"
	},
	"mint": {
		"--col-bg1": "#2E2E2E",
		"--col-bg2": "#404040",
		"--col-bg3": "#6C6C6C",
		"--col-bgh": "#8AB057",
		"--col-txt1": "#FFFFFF",
		"--col-txth": "#FFFFFF",
	}
}

persohome.classList.toggle("disp");

var inView = false;

function clearActive() {
	[...document.getElementsByClassName("onebtn")].forEach(element => { element.classList.remove("active"); })
}


function openApp(name, data) {
	iframe.style.opacity = 0;
	oriloaderstatic.style.display = "block";
	setTimeout(() => {
		iframe.src = "apps/" + name;
	}, 300);
	iframe.onload = () => {
		try { iframe.contentWindow.greenflag({ data }) } catch { }
		setTheme(curtheme, iframe.contentDocument.documentElement);
		setTimeout(() => {
			iframe.style.opacity = 1;
			oriloaderstatic.style.display = "none"
		}, 500);
	}
}

[...document.getElementsByClassName("onebtn")].forEach(element => {
	element.onclick = (ele) => {
		clearActive();
		element.classList.add("active");
		openApp(element.getAttribute("data-name"))
	};
});
let toastInProgress = false
let toastQueue = []
const soloDuration = 5000
const queuedDuration = 3000

function notify(text) {
	if (toastInProgress) {
		toastQueue.push(text)
	} else {
		toastInProgress = true
		const d = toastQueue.length > 0 ? queuedDuration : soloDuration
		displayToast(text, d)
	}
}

function toast(text) {
	notify(text)
}

function displayToast(text, duration) {
	const t = document.getElementById('toastdivtext')
	if (!t) return
	t.innerText = text
	const el = document.getElementById('toastdiv')
	el.style.zIndex = 5
	el.classList.add('notifpullanim')
	el.style.display = 'block'

	setTimeout(function () {
		el.classList.remove('closeEffect')
	}, 200)

	el.onclick = function () {
		el.classList.add('closeEffect')
		el.style.display = 'none'
		toastInProgress = false
		if (toastQueue.length > 0) {
			const next = toastQueue.shift()
			const d = toastQueue.length > 0 ? queuedDuration : soloDuration
			displayToast(next, d)
		}
	}

	setTimeout(function () {
		el.classList.add('closeEffect')
		setTimeout(function () {
			el.style.display = 'none'
			toastInProgress = false
			if (toastQueue.length > 0) {
				const next = toastQueue.shift()
				const d = toastQueue.length > 0 ? queuedDuration : soloDuration
				displayToast(next, d)
			}
		}, 200)
	}, duration)
}


function makedialogclosable(ok) {
	const myDialog = gid(ok);

	if (!myDialog.__originalClose) {
		myDialog.__originalClose = myDialog.close;
		myDialog.close = function () {
			console.log(342, ok)
			this.classList.add("closeEffect");

			function handler() {
				myDialog.__originalClose();
				myDialog.classList.remove("closeEffect");
			};
			setTimeout(handler, 200);
		};
	}

	document.addEventListener('click', (event) => {
		if (event.target === myDialog) {
			myDialog.close();
		}
	});
}
function openModal(type, { title = '', message, options = null, status = null, preset = '' } = {}) {
	return new Promise((resolve) => {
		const modal = document.createElement('dialog');
		modal.classList.add('modal');

		const modalItemsCont = document.createElement('div');
		modalItemsCont.classList.add('modal-items');

		const icon = document.createElement('span');
		icon.classList.add('material-symbols-rounded');
		let ic = "warning";
		if (status === "success") ic = "check_circle";
		else if (status === "failed") ic = "dangerous";
		icon.textContent = ic;
		icon.classList.add('modal-icon');
		modalItemsCont.appendChild(icon);

		if (title && title.length > 0) {

			const h1 = document.createElement('h1');
			h1.textContent = title;
			modalItemsCont.appendChild(h1);
		}

		const p = document.createElement('p');
		if (type === 'say' || type === 'confirm') {
			p.innerHTML = `${message}`;
		} else {
			p.textContent = message;
		}
		modalItemsCont.appendChild(p);

		let dropdown = null;
		if (type === 'dropdown') {
			dropdown = document.createElement('select');
			let items = Array.isArray(options) ? options : Object.values(options);
			for (const option of items) {
				const opt = document.createElement('option');
				opt.value = option;
				opt.textContent = option;
				dropdown.appendChild(opt);
			}
			modalItemsCont.appendChild(dropdown);
		}

		let inputField = null;
		if (type === 'ask') {
			inputField = document.createElement('input');
			inputField.type = 'text';
			inputField.value = preset;
			modalItemsCont.appendChild(inputField);
		}

		const btnContainer = document.createElement('div');
		btnContainer.classList.add('button-container');
		modalItemsCont.appendChild(btnContainer);

		const yesButton = document.createElement('button');
		yesButton.textContent = type === 'confirm' ? 'Yes' : 'OK';
		btnContainer.appendChild(yesButton);

		if (type === 'confirm' || type === 'dropdown') {
			const noButton = document.createElement('button');
			noButton.textContent = type === 'confirm' ? 'No' : 'Cancel';
			btnContainer.appendChild(noButton);
			noButton.onclick = () => {
				modal.close();
				modal.remove();
				resolve(false);
			};
		}

		yesButton.onclick = () => {
			modal.close();
			modal.remove();
			if (type === 'dropdown') {
				resolve(dropdown.value);
			} else if (type === 'ask') {
				resolve(inputField.value);
			} else {
				resolve(true);
			}
		};
		document.body.appendChild(modal);
		modal.appendChild(modalItemsCont);
		modal.showModal();
	});
}

function justConfirm(title, message) {
	return openModal('confirm', { title, message });
}
function showDropdownModal(title, message, options) {
	return openModal('dropdown', { title, message, options });
}
function say(message, status = null) {
	return openModal('say', { message, status });
}
function ask(question, preset = '') {
	return openModal('ask', { message: question, preset });
}

openApp("home");

function setTheme(themeName, documentItem = document.documentElement) {
	themeName = themeName.toLowerCase();
	var themeDecs = theme[themeName];
	accent = themeDecs["--col-bgh"];
	Object.keys(themeDecs).forEach(i => {
		documentItem.style.setProperty(i, themeDecs[i]);
	});
}

document.getElementById("themesel").addEventListener("change", (ev) => {
	curtheme = ev.target.value;
	localStorage.setItem("orion-theme", curtheme)
	setTheme(curtheme);
	setTheme(curtheme, iframe.contentDocument.documentElement)
})
async function setTheme(themeName, documentItem = document.documentElement) {
	themeName = themeName.toLowerCase();
	let themeDecs = theme[themeName];
	Object.keys(themeDecs).forEach(key => {
		let val = themeDecs[key];
		if (settings.get("img_bg") && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(val)) {
			val = hexToRGBA(val, 0.8);
		}
		documentItem.style.setProperty(key, val);
	});
}

function hexToRGBA(hex, alpha = 1) {
	hex = hex.replace(/^#/, '');
	if (hex.length === 3) hex = hex.split('').map(h => h + h).join('');
	const num = parseInt(hex, 16);
	const r = (num >> 16) & 255;
	const g = (num >> 8) & 255;
	const b = num & 255;
	return `rgba(${r},${g},${b},${alpha})`;
}
async function applyBgSts() {
	let x = settings.get("img_bg");
	if (!x) return;
	const proxyUrl = `https://proxy.mistium.com/?url=${encodeURIComponent(x)}`;
	try {
		const res = await fetch(proxyUrl);
		const blob = await res.blob();
		const reader = new FileReader();
		reader.onloadend = () => {
			document.body.style.backgroundImage = `url(${reader.result})`;
		};
		reader.readAsDataURL(blob);
	} catch (e) {
		console.error("Failed to load background:", e);
	}
}


setTheme(curtheme);
applyBgSts();
document.getElementById("themesel").value = curtheme;

var sidebarCont = document.getElementById("sidebarapp");
var divider = document.querySelector('#divider');
var overlay = document.getElementById('overlay');

let isDragging = false;
let startX = 0;
let startWidth = 0;

divider.addEventListener('mousedown', e => {
	isDragging = true;
	startX = e.clientX;
	startWidth = sidebarCont.offsetWidth;
	overlay.classList.add('active');
	document.body.style.userSelect = 'none';
});

document.addEventListener('mousemove', e => {
	if (!isDragging) return;
	const dx = startX - e.clientX;
	let newWidth = (startWidth + dx);
	if (newWidth < 0) newWidth = 0;
	sidebarCont.style.width = newWidth + 'px';
});

document.addEventListener('mouseup', e => {
	if (!isDragging) return;
	isDragging = false;
	overlay.classList.remove('active');
	document.body.style.userSelect = '';
});

sidebarCont.style.overflow = 'hidden';


function launchSideBarApp(name, data) {
	sidebarCont.style.display = 'flex';
	document.getElementById("sidebarappname").innerText = name;
	setTimeout(() => sidebarCont.style.width = "500px");
	sidebarappframe.src = "apps/" + name;
	oriloaderstatic2.style.display = "block"
	sidebarappframe.onload = () => {
		oriloaderstatic2.style.display = "none"
		try { sidebarappframe.contentWindow.greenflag({ data }) } catch { }
	}
}

function closeSideBar() {
	sidebarCont.style.width = "0px";
	setTimeout(() => sidebarCont.style.display = 'none', 200);
}
closeSideBar();

document.querySelectorAll(".checkbox").forEach(item => {
	const key = item.getAttribute("data-setting");
	if (settings.get(key)) item.classList.add("enabled");
	else item.classList.remove("enabled");

	item.onclick = () => {
		const v = !item.classList.contains("enabled");
		settings.set(key, v);
		item.classList.toggle("enabled");
	};
});

document.querySelectorAll(".textInput").forEach(item => {
	const key = item.getAttribute("data-setting");
	const input = document.createElement("input");
	input.type = "text";
	input.value = settings.get(key) || "";
	item.appendChild(input);

	input.oninput = () => {
		settings.set(key, input.value);
	};
});


async function sidebartoggle() {
	sidebar.classList.toggle("collapsed");
	if (sidebar.classList.contains("collapsed")) {
		settings.set("sidebarCollapse", 1)
	} else {
		settings.set("sidebarCollapse", 0)
	}

}

if (settings.get("sidebarCollapse")) {
	sidebartoggle();
}

var startupLoaderElement = document.getElementById("oriFullPLoader");
var loaderTexts = ["Add ?s=claw in url to open claw", "Add ?s=orichats in url to open OriginChats", "Add ?s=credits in url to open credits dashboard", "Click on the originchats loader if its stuck", "ctrl+s brings up orion settings", "Add ?rtr=dont in url to prevent rotur connection"];
document.getElementById("flashText").innerText = loaderTexts[Math.floor(Math.random() * loaderTexts.length)];

var startupLoader = {
	cl: () => {
		startupLoaderElement.style.display = "none";
	},
	mark_complete: (process) => {
		if (process == 4) {
			startupLoader.cl();
			return
		}
		var ele = document.querySelector(`[startup-loader="${process}"]`);
		ele.innerHTML = `<i class="material-symbols-rounded">check</i>`;
		ele.parentElement.classList.add("done")
	},
	mark_error: (process) => {
		var ele = document.querySelector(`[startup-loader="${process}"]`);
		ele.innerHTML = `<i class="material-symbols-rounded" style="color: red">close</i>`
	},
	dead: () => {
		document.getElementById("oriFullPLoader").style = `
    width: 250px;
    padding: 1em;`
		iframe.src = "https://rotur.dev/status";
		document.getElementById("flashText").innerHTML = `Contact <a class="link" href="https://github.com/orgs/RoturTW/people">Rotur Team</a>`;
	}
}
startupLoader.mark_complete("1")

document.addEventListener('keydown', function (e) {
	if (e.ctrlKey && e.key === 's') {
		e.preventDefault();
		document.getElementById('settingsd').showModal();
	}
});

const z = 1 / (window.devicePixelRatio || 1);
const m = document.querySelector('meta[name=viewport]') || (() => {
	const t = document.createElement('meta');
	t.name = 'viewport';
	document.head.appendChild(t);
	return t;
})();
m.setAttribute('content', `initial-scale=${z}, maximum-scale=${z}, minimum-scale=${z}, width=device-width`);

function changeSysToNva() {
	roturExtension.setkey({ KEY: "system", VALUE: "orion" });
	toast("🫵😎 " + roturExtension.user.username + " upgraded to orion");
	document.getElementById('orionBadgeAlert').close();
}

function dontchsysnva() {
	document.getElementById('orionBadgeAlert').close();
}
if ('serviceWorker' in navigator && !navigator.serviceWorker.controller) {
    navigator.serviceWorker.register('sw.js', { scope: '/' });
}
