const handleLogin = async () => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password, // ✅ CORRIGIDO
        }),
      }
    );

    const data = await response.json();
    console.log(data);

    if (!response.ok) {
      throw new Error(data.detail || "Erro no login");
    }

    localStorage.setItem("token", data.access_token);
    window.location.href = "/dashboard";
  } catch (err) {
    alert("Erro no login");
    console.error(err);
  }
};
