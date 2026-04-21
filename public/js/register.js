const API_BASE_URL = window.location.protocol === "file:" ? "http://localhost:3000" : window.location.origin;

async function register(e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const fecha = document.getElementById("fecha").value;

  if (!nombre || !apellido || !email || !password || !fecha) {
    alert("Completa todos los campos.");
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/usuarios`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre,
        apellido,
        email,
        contraseña: password,
        fecha_nacimiento: fecha
      })
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message || "No se pudo registrar el usuario.");
      return false;
    }

    sessionStorage.setItem("usuario", JSON.stringify(data.usuario));
    alert("Registro exitoso.");
    window.location.href = "home.html";
  } catch (error) {
    alert("No se pudo conectar con el servidor.");
  }

  return false;
}