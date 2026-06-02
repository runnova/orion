const user = window.parent.roturExtension.user;

document.querySelector(".display_name").textContent =
    user.display_name || "Unknown User";

document.querySelector(".username").textContent =
    `@${user.username || "unknown"}`;

document.querySelector(".about_me").textContent =
    user.bio || "No bio provided.";

const pfp = document.querySelector(".pfp img:not(.overlay)");
if (user.username) {
    pfp.src = `https://avatars.rotur.dev/${user.username}`;
}

const overlay = document.querySelector(".pfp .overlay");
if (user.username) {
    overlay.src = `https://avatars.rotur.dev/.overlay/${user.username}`;
}

const banner = document.getElementById("cover_picture");
if (user.username) {
    banner.src = `https://avatars.rotur.dev/.banners/${user.username}`;
}

const cards = document.querySelectorAll(".gallery_strip .card");

cards[0].querySelector(".credits_amount").textContent =
    user.balance ?? 0;

cards[1].querySelector(".credits_amount").textContent =
    user.friends?.length ?? 0;

cards[2].querySelector(".credits_amount").textContent =
    user.followers?.length ?? 0;

cards[3].querySelector(".credits_amount").textContent =
    user.following?.length ?? 0;