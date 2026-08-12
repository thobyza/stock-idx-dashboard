import { Router } from 'express';                                                                                                                                                                              
import { getStocks, getHistory } from '../controllers/stockController.js';                                                                                                                                     

const router = Router();
                                                                                                                         
router.get('/', getStocks);                                                                                                                                                                                    
router.get('/:symbol/history', getHistory); 

export default router;


                                                                               