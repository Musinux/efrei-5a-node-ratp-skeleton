import express from 'express'
import getRoute from '../controllers/get.route.js'
const router = express.Router()

router.get('/route', getRoute)

/**
 * This route can be useful if you'd like to make updates about the progression
 * of the algorithm
 * => If your algorithm takes more than some seconds,
 *    you may want to return a "in progress" statement
 *    in GET /route, and then return updates from this route
 * Not mandatory in the beggining of your work
 */
// router.get('/route/updates/:id')

export default router

