export default async function handler(req, res) {
  try {
    const { kabkota_id } = req.query;
    let url = `http://192.168.60.110:98/api/master/pasar`;
    if (kabkota_id) url += `?kabkota_id=${kabkota_id}`;
    const response = await fetch(url);
    const json = await response.json();
    res.status(200).json(json);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
