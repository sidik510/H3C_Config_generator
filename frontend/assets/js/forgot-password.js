document
        .getElementById("forgot-form")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const email = document.getElementById("email").value;

          try {
            const res = await fetch(
              "http://localhost:3000/api/users/forgot-password",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
              }
            );

            const data = await res.json();
            alert(data.message);
          } catch (err) {
            alert("Terjadi kesalahan saat mengirim permintaan.");
            console.error(err);
          }
        });