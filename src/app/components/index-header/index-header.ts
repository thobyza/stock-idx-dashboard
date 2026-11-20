import { Component, input } from '@angular/core';                                          
import { DecimalPipe } from '@angular/common';                                                                                

@Component({
  selector: 'app-index-header',
  imports: [DecimalPipe],
  templateUrl: './index-header.html',
  styleUrl: './index-header.css',
})

export class IndexHeader {
  // ihsg = input.required<IndexData>();                                                      
  // advancing = input.required<number>();                                                    
  // unchanged = input.required<number>();                                                    
  // declining = input.required<number>();                                                    
  // total = input.required<number>();                                                        
  // isLive = input.required<boolean>(); 
}

