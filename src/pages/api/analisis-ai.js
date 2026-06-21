export default async function handler(req, res) {
  try {
    const response = await fetch(
      "http://192.168.60.24:5678/webhook/analisis-kabupaten",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.body),
      }
    );

    const data = await response.json();

    res.status(200).json(data);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message,
    });
  }
}