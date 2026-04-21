const API_BASE_URL = window.location.protocol === "file:" ? "http://localhost:3000" : window.location.origin;

async function login(e) {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  try {
    const response = await fetch(`${API_BASE_URL}/usuarios/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email,
        contraseña: password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "Email o contraseña incorrectos.");
      return false;
    }

    sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
    alert(`¡Bienvenido, ${data.usuario.nombre}!`);
    window.location.href = "pages/home.html";
  } catch (error) {
    alert("No se pudo conectar con el servidor.");
  }

  return false;
}