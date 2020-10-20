export default async function getRoute (req, res) {
  try {
    const { start, stop } = req.query
    // TODO find the shortest path between `start` and `stop`
    res.json({ path: [] })
  } catch (err) {
    res.status(500)
    res.json({
      message: 'La station n\'existe pas'
    })
  }
}
