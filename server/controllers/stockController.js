import { stockService } from '../services/stockService.js';                                                                                                                                                    
                                                                                                                                                                                                                   
export const getStocks = async (req, res) => {                                                                                                                                                                 
  try {                                                                                                                                                                                                        
    const data = await stockService.getStocksData();                                                                                                                                                           
    res.json(data);                                                                                                                                                                                            
  } catch (error) {                                                                                                                                                                                            
    res.status(500).json({ error: 'Failed to retrieve stock list' });                                                                                                                                          
  }                                                                                                                                                                                                            
};     

export const getHistory = async (req, res) => {                                                                                                                                                                
  try {                                                                                                                                                                                                        
    const { symbol } = req.params;                                                                                                                                                                             
    const history = await stockService.getStockHistory(symbol);                                                                                                                                                
    res.json(history);                                                                                                                                                                                         
  } catch (error) {                                                                                                                                                                                            
    res.status(500).json({ error: `Failed to retrieve history for ${req.params.symbol}` });                                                                                                                    
  }                                                                                                                                                                                                            
};  
