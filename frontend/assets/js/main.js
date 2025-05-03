document.addEventListener("DOMContentLoaded", () => {
  // Load header
  fetch("../../frontend/component/header.html")
    .then((res) => {
      if (!res.ok) throw new Error("Gagal memuat header");
      return res.text();
    })
    .then((data) => {
      document.getElementById("header-placeholder").innerHTML = data;
    })
    .catch((error) => {
      console.error("Error loading header:", error);
    });

  // Load footer
  fetch("../../frontend/component/footer.html")
    .then((res) => {
      if (!res.ok) throw new Error("Gagal memuat footer");
      return res.text();
    })
    .then((data) => {
      document.getElementById("footer-placeholder").innerHTML = data;
    })
    .catch((error) => {
      console.error("Error loading footer:", error);
    });
});