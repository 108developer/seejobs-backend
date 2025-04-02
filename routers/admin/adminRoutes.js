import express from 'express'
import { currentEmlpoyers, currentJobs, currentUsers, getTodaysJobPostings } from '../../controllers/admin/adminCotroller.js';

const router = express.Router();

router.get('/nousers' ,  currentUsers )

router.get('/nojobs' ,  currentJobs )

router.get('/noEmployers' ,  currentEmlpoyers )

router.get('/todayjob' ,  getTodaysJobPostings )



export default router ;