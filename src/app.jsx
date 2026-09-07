import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";

// =============================================================================
// DATA
//   POOL: Yahoo ADP pool (9/5) + Fantasy Index (9/7) + Footballguys (9/7)
//     a=ADP  b=bye  f=FFI per-start FPG  st=FFI expected starts  tot=FFI season pts
//     fv=FBG season value  pwF/pwB/pwP=per-week by source (FI, FBG, PFF)  pw=equal-weight blend
//     wk=this-week value blend  rk=FFI PPR pos rank  rkB=FBG pos rank
//     fl=FBG flags (g injured, P rookie, Q upside, h suspended, X concussion)
//   NFL: 2026 schedule  TEAMS_INIT: draft-day rosters  NEWS: Fantasy Index notes 9/7
// =============================================================================
const POOL = [{"id":"jahmyr-gibbs","n":"Jahmyr Gibbs","p":"RB","t":"DET","b":6,"a":1.3,"f":19.1,"st":16.0,"tot":305,"rk":1,"fv":358,"rkB":1,"pw":19.0,"pwF":17.9,"pwB":21.1,"wk":19.4,"src":"FBP","pwP":18.0},{"id":"bijan-robinson","n":"Bijan Robinson","p":"RB","t":"ATL","b":11,"a":2.0,"f":18.3,"st":16.0,"tot":292,"rk":2,"fv":340,"rkB":2,"pw":18.1,"pwF":17.2,"pwB":20.0,"wk":18.5,"src":"FBP","pwP":17.2},{"id":"jamarr-chase","n":"Ja'Marr Chase","p":"WR","t":"CIN","b":6,"a":3.5,"f":14.8,"st":17.0,"tot":252,"rk":1,"fv":321,"rkB":1,"pw":16.4,"pwF":14.8,"pwB":18.9,"wk":16.4,"src":"FBP","pwP":15.4},{"id":"puka-nacua","n":"Puka Nacua","p":"WR","t":"LAR","b":11,"a":5.0,"f":14.9,"st":16.0,"tot":239,"rk":4,"fv":300,"rkB":2,"pw":15.7,"pwF":14.1,"pwB":17.6,"wk":15.9,"src":"FBP","pwP":15.3},{"id":"christian-mccaffrey","n":"Christian McCaffrey","p":"RB","t":"SF","b":8,"a":5.9,"f":15.4,"st":15.5,"tot":238,"rk":6,"fv":328,"rkB":3,"pw":16.7,"pwF":14.0,"pwB":19.3,"wk":17.1,"src":"FBP","pwP":16.7},{"id":"jonathan-taylor","n":"Jonathan Taylor","p":"RB","t":"IND","b":13,"a":6.2,"f":17.0,"st":15.8,"tot":269,"rk":3,"fv":297,"rkB":4,"pw":16.5,"pwF":15.8,"pwB":17.5,"wk":16.9,"src":"FBP","pwP":16.1},{"id":"jaxon-smith-njigba","n":"Jaxon Smith-Njigba","p":"WR","t":"SEA","b":11,"a":7.3,"f":14.3,"st":17.0,"tot":244,"rk":3,"fv":273,"rkB":3,"pw":15.2,"pwF":14.4,"pwB":16.1,"wk":15.1,"src":"FBP","pwP":15.0},{"id":"amon-ra-st-brown","n":"Amon-Ra St. Brown","p":"WR","t":"DET","b":6,"a":7.9,"f":14.2,"st":17.0,"tot":242,"rk":2,"fv":272,"rkB":4,"pw":14.6,"pwF":14.2,"pwB":16.0,"wk":14.6,"src":"FBP","pwP":13.6},{"id":"james-cook-iii","n":"James Cook III","p":"RB","t":"BUF","b":7,"a":9.4,"f":16.9,"st":16.0,"tot":270,"rk":4,"fv":279,"rkB":5,"pw":16.0,"pwF":15.9,"pwB":16.4,"wk":16.3,"src":"FBP","pwP":15.6},{"id":"ceedee-lamb","n":"CeeDee Lamb","p":"WR","t":"DAL","b":14,"a":11.1,"f":13.7,"st":16.5,"tot":226,"rk":5,"fv":253,"rkB":5,"pw":13.9,"pwF":13.3,"pwB":14.9,"wk":14.0,"src":"FBP","pwP":13.5},{"id":"saquon-barkley","n":"Saquon Barkley","p":"RB","t":"PHI","b":10,"a":11.3,"f":14.4,"st":15.7,"tot":227,"rk":11,"fv":268,"rkB":7,"pw":14.1,"pwF":13.4,"pwB":15.8,"wk":14.4,"src":"FBP","pwP":13.1},{"id":"justin-jefferson","n":"Justin Jefferson","p":"WR","t":"MIN","b":6,"a":13.3,"f":13.3,"st":16.5,"tot":219,"rk":6,"fv":239,"rkB":8,"pw":13.6,"pwF":12.9,"pwB":14.1,"wk":13.7,"src":"FBP","pwP":13.7},{"id":"kenneth-walker-iii","n":"Kenneth Walker III","p":"RB","t":"KC","b":5,"a":15.3,"f":14.0,"st":16.0,"tot":225,"rk":9,"fv":259,"rkB":9,"pw":14.1,"pwF":13.2,"pwB":15.2,"wk":14.3,"src":"FBP","pwP":13.8},{"id":"devon-achane","n":"De'Von Achane","p":"RB","t":"MIA","b":6,"a":15.3,"f":14.8,"st":16.0,"tot":236,"rk":7,"fv":259,"rkB":10,"pw":14.9,"pwF":13.9,"pwB":15.2,"wk":15.2,"src":"FBP","pwP":15.5},{"id":"chase-brown","n":"Chase Brown","p":"RB","t":"CIN","b":6,"a":15.7,"f":15.3,"st":16.0,"tot":245,"rk":5,"fv":261,"rkB":8,"pw":14.7,"pwF":14.4,"pwB":15.4,"wk":15.0,"src":"FBP","pwP":14.2},{"id":"derrick-henry","n":"Derrick Henry","p":"RB","t":"BAL","b":13,"a":17.1,"f":16.0,"st":15.5,"tot":248,"rk":8,"fv":270,"rkB":6,"pw":14.6,"pwF":14.6,"pwB":15.9,"wk":15.1,"src":"FBP","pwP":13.4},{"id":"ashton-jeanty","n":"Ashton Jeanty","p":"RB","t":"LV","b":13,"a":17.9,"f":14.0,"st":15.0,"tot":211,"rk":10,"fv":246,"rkB":13,"pw":13.4,"pwF":12.4,"pwB":14.5,"wk":14.0,"src":"FBP","fl":"g","pwP":13.4},{"id":"omarion-hampton","n":"Omarion Hampton","p":"RB","t":"LAC","b":7,"a":18.1,"f":12.7,"st":16.0,"tot":203,"rk":14,"fv":250,"rkB":11,"pw":13.1,"pwF":11.9,"pwB":14.7,"wk":13.4,"src":"FBP","pwP":12.8},{"id":"drake-london","n":"Drake London","p":"WR","t":"ATL","b":11,"a":20.2,"f":11.3,"st":17.0,"tot":193,"rk":13,"fv":241,"rkB":7,"pw":13.1,"pwF":11.4,"pwB":14.2,"wk":13.0,"src":"FBP","pwP":13.6},{"id":"josh-allen","n":"Josh Allen","p":"QB","t":"BUF","b":7,"a":20.7,"f":20.3,"st":16.6,"tot":337,"rk":1,"fv":418,"rkB":1,"pw":21.1,"pwF":19.8,"pwB":24.6,"wk":21.3,"src":"FBP","pwP":18.9},{"id":"brock-bowers","n":"Brock Bowers","p":"TE","t":"LV","b":13,"a":21.0,"f":12.5,"st":17.0,"tot":212,"rk":1,"fv":247,"rkB":1,"pw":12.6,"pwF":12.5,"pwB":14.5,"wk":12.6,"src":"FBP","pwP":10.8},{"id":"nico-collins","n":"Nico Collins","p":"WR","t":"HOU","b":8,"a":21.5,"f":12.0,"st":16.5,"tot":199,"rk":11,"fv":236,"rkB":10,"pw":12.5,"pwF":11.7,"pwB":13.9,"wk":12.6,"src":"FBP","pwP":11.9},{"id":"george-pickens","n":"George Pickens","p":"WR","t":"DAL","b":14,"a":22.5,"f":12.2,"st":17.0,"tot":208,"rk":8,"fv":238,"rkB":9,"pw":12.6,"pwF":12.2,"pwB":14.0,"wk":12.6,"src":"FBP","pwP":11.5},{"id":"aj-brown","n":"A.J. Brown","p":"WR","t":"NE","b":11,"a":24.0,"f":12.7,"st":16.0,"tot":203,"rk":10,"fv":249,"rkB":6,"pw":12.9,"pwF":11.9,"pwB":14.6,"wk":13.2,"src":"FBP","pwP":12.2},{"id":"trey-mcbride","n":"Trey McBride","p":"TE","t":"ARI","b":14,"a":27.3,"f":12.1,"st":17.0,"tot":205,"rk":2,"fv":211,"rkB":2,"pw":11.9,"pwF":12.1,"pwB":12.4,"wk":11.9,"src":"FBP","pwP":11.3},{"id":"kyren-williams","n":"Kyren Williams","p":"RB","t":"LAR","b":11,"a":27.9,"f":13.3,"st":16.0,"tot":212,"rk":15,"fv":246,"rkB":12,"pw":13.3,"pwF":12.5,"pwB":14.5,"wk":13.6,"src":"FBP","pwP":12.9},{"id":"devonta-smith","n":"DeVonta Smith","p":"WR","t":"PHI","b":10,"a":29.5,"f":11.9,"st":17.0,"tot":202,"rk":9,"fv":224,"rkB":11,"pw":12.3,"pwF":11.9,"pwB":13.2,"wk":12.3,"src":"FBP","pwP":11.7},{"id":"jeremiyah-love","n":"Jeremiyah Love","p":"RB","t":"ARI","b":14,"a":29.8,"f":11.7,"st":15.0,"tot":175,"rk":20,"fv":208,"rkB":21,"pw":11.7,"pwF":10.3,"pwB":12.2,"wk":12.2,"src":"FBP","fl":"Pg","pwP":12.7},{"id":"malik-nabers","n":"Malik Nabers","p":"WR","t":"NYG","b":8,"a":30.3,"f":12.1,"st":15.8,"tot":190,"rk":14,"fv":216,"rkB":14,"pw":11.7,"pwF":11.2,"pwB":12.7,"wk":12.0,"src":"FBP","fl":"g","pwP":11.1},{"id":"chris-olave","n":"Chris Olave","p":"WR","t":"NO","b":8,"a":31.1,"f":12.7,"st":16.0,"tot":204,"rk":7,"fv":213,"rkB":17,"pw":12.0,"pwF":12.0,"pwB":12.5,"wk":12.2,"src":"FBP","pwP":11.4},{"id":"javonte-williams","n":"Javonte Williams","p":"RB","t":"DAL","b":14,"a":33.5,"f":13.2,"st":16.0,"tot":211,"rk":12,"fv":233,"rkB":15,"pw":12.9,"pwF":12.4,"pwB":13.7,"wk":13.2,"src":"FBP","pwP":12.6},{"id":"tee-higgins","n":"Tee Higgins","p":"WR","t":"CIN","b":6,"a":33.6,"f":11.0,"st":16.5,"tot":182,"rk":21,"fv":212,"rkB":18,"pw":11.3,"pwF":10.7,"pwB":12.5,"wk":11.4,"src":"FBP","fl":"g","pwP":10.8},{"id":"breece-hall","n":"Breece Hall","p":"RB","t":"NYJ","b":13,"a":34.6,"f":13.1,"st":15.0,"tot":197,"rk":17,"fv":235,"rkB":14,"pw":12.7,"pwF":11.6,"pwB":13.8,"wk":13.2,"src":"FBP","fl":"g","pwP":12.6},{"id":"zay-flowers","n":"Zay Flowers","p":"WR","t":"BAL","b":13,"a":35.6,"f":11.3,"st":16.5,"tot":186,"rk":16,"fv":215,"rkB":16,"pw":11.6,"pwF":10.9,"pwB":12.6,"wk":11.7,"src":"FBP","pwP":11.3},{"id":"rashee-rice","n":"Rashee Rice","p":"WR","t":"KC","b":5,"a":35.8,"f":11.9,"st":15.3,"tot":182,"rk":18,"fv":217,"rkB":13,"pw":11.4,"pwF":10.7,"pwB":12.8,"wk":11.8,"src":"FBP","fl":"g","pwP":10.8},{"id":"lamar-jackson","n":"Lamar Jackson","p":"QB","t":"BAL","b":13,"a":38.7,"f":18.3,"st":16.0,"tot":293,"rk":5,"fv":373,"rkB":4,"pw":19.0,"pwF":17.2,"pwB":21.9,"wk":19.4,"src":"FBP","pwP":18.0},{"id":"colston-loveland","n":"Colston Loveland","p":"TE","t":"CHI","b":10,"a":39.2,"f":10.1,"st":17.0,"tot":172,"rk":3,"fv":175,"rkB":4,"pw":10.1,"pwF":10.1,"pwB":10.3,"wk":10.1,"src":"FBP","pwP":9.8},{"id":"jaylen-waddle","n":"Jaylen Waddle","p":"WR","t":"DEN","b":10,"a":39.8,"f":10.9,"st":16.0,"tot":174,"rk":22,"fv":207,"rkB":21,"pw":11.0,"pwF":10.2,"pwB":12.2,"wk":11.2,"src":"FBP","pwP":10.5},{"id":"tetairoa-mcmillan","n":"Tetairoa McMillan","p":"WR","t":"CAR","b":5,"a":41.9,"f":11.3,"st":16.5,"tot":186,"rk":19,"fv":207,"rkB":20,"pw":11.5,"pwF":10.9,"pwB":12.2,"wk":11.6,"src":"FBP","pwP":11.3},{"id":"travis-etienne-jr","n":"Travis Etienne Jr.","p":"RB","t":"NO","b":8,"a":41.9,"f":13.2,"st":16.2,"tot":214,"rk":13,"fv":229,"rkB":17,"pw":12.2,"pwF":12.6,"pwB":13.5,"wk":12.4,"src":"FBP","pwP":10.6},{"id":"cam-skattebo","n":"Cam Skattebo","p":"RB","t":"NYG","b":8,"a":42.4,"f":11.1,"st":16.0,"tot":177,"rk":22,"fv":205,"rkB":23,"pw":10.8,"pwF":10.4,"pwB":12.1,"wk":11.0,"src":"FBP","pwP":9.8},{"id":"ladd-mcconkey","n":"Ladd McConkey","p":"WR","t":"LAC","b":7,"a":44.6,"f":11.3,"st":17.0,"tot":191,"rk":12,"fv":220,"rkB":12,"pw":11.7,"pwF":11.2,"pwB":12.9,"wk":11.7,"src":"FBP","pwP":11.0},{"id":"dandre-swift","n":"D'Andre Swift","p":"RB","t":"CHI","b":10,"a":45.6,"f":12.5,"st":16.3,"tot":204,"rk":16,"fv":229,"rkB":18,"pw":12.1,"pwF":12.0,"pwB":13.5,"wk":12.3,"src":"FBP","fl":"g","pwP":10.9},{"id":"emeka-egbuka","n":"Emeka Egbuka","p":"WR","t":"TB","b":10,"a":45.7,"f":10.0,"st":15.0,"tot":149,"rk":33,"fv":198,"rkB":24,"pw":10.4,"pwF":8.8,"pwB":11.6,"wk":10.8,"src":"FBP","pwP":10.7},{"id":"tyler-warren","n":"Tyler Warren","p":"TE","t":"IND","b":13,"a":47.0,"f":9.6,"st":16.0,"tot":153,"rk":4,"fv":176,"rkB":3,"pw":9.5,"pwF":9.0,"pwB":10.4,"wk":9.7,"src":"FBP","pwP":9.2},{"id":"garrett-wilson","n":"Garrett Wilson","p":"WR","t":"NYJ","b":13,"a":47.7,"f":11.3,"st":16.5,"tot":186,"rk":15,"fv":208,"rkB":19,"pw":11.4,"pwF":10.9,"pwB":12.2,"wk":11.6,"src":"FBP","pwP":11.2},{"id":"drake-maye","n":"Drake Maye","p":"QB","t":"NE","b":11,"a":47.8,"f":18.5,"st":16.0,"tot":296,"rk":3,"fv":391,"rkB":2,"pw":19.7,"pwF":17.4,"pwB":23.0,"wk":20.0,"src":"FBP","pwP":18.6},{"id":"joe-burrow","n":"Joe Burrow","p":"QB","t":"CIN","b":6,"a":50.3,"f":18.2,"st":16.1,"tot":293,"rk":2,"fv":377,"rkB":3,"pw":18.9,"pwF":17.2,"pwB":22.2,"wk":19.3,"src":"FBP","pwP":17.4},{"id":"josh-jacobs","n":"Josh Jacobs","p":"RB","t":"GB","b":11,"a":51.8,"f":13.4,"st":9.0,"tot":120,"rk":41,"fv":76,"rkB":62,"pw":5.8,"pwF":7.1,"pwB":4.5,"wk":6.6,"src":"FB","fl":"h"},{"id":"david-montgomery","n":"David Montgomery","p":"RB","t":"HOU","b":8,"a":53.1,"f":10.9,"st":15.6,"tot":170,"rk":27,"fv":210,"rkB":20,"pw":11.1,"pwF":10.0,"pwB":12.4,"wk":11.4,"src":"FBP","pwP":11.0},{"id":"bucky-irving","n":"Bucky Irving","p":"RB","t":"TB","b":10,"a":53.9,"f":11.1,"st":15.0,"tot":166,"rk":25,"fv":212,"rkB":19,"pw":11.3,"pwF":9.8,"pwB":12.5,"wk":11.7,"src":"FBP","pwP":11.6},{"id":"terry-mclaurin","n":"Terry McLaurin","p":"WR","t":"WAS","b":7,"a":54.3,"f":10.1,"st":16.5,"tot":166,"rk":29,"fv":194,"rkB":26,"pw":10.6,"pwF":9.8,"pwB":11.4,"wk":10.7,"src":"FBP","pwP":10.6},{"id":"quinshon-judkins","n":"Quinshon Judkins","p":"RB","t":"CLE","b":11,"a":54.6,"f":11.8,"st":15.5,"tot":184,"rk":19,"fv":231,"rkB":16,"pw":12.1,"pwF":10.8,"pwB":13.6,"wk":12.4,"src":"FBP","pwP":11.9},{"id":"jayden-daniels","n":"Jayden Daniels","p":"QB","t":"WAS","b":7,"a":55.5,"f":18.2,"st":15.5,"tot":281,"rk":13,"fv":353,"rkB":6,"pw":18.4,"pwF":16.5,"pwB":20.8,"wk":19.0,"src":"FBP","pwP":18.0},{"id":"jalen-hurts","n":"Jalen Hurts","p":"QB","t":"PHI","b":10,"a":56.5,"f":18.4,"st":16.0,"tot":295,"rk":8,"fv":368,"rkB":5,"pw":19.1,"pwF":17.4,"pwB":21.6,"wk":19.4,"src":"FBP","pwP":18.3},{"id":"davante-adams","n":"Davante Adams","p":"WR","t":"LAR","b":11,"a":56.9,"f":10.7,"st":15.8,"tot":168,"rk":24,"fv":197,"rkB":25,"pw":10.6,"pwF":9.9,"pwB":11.6,"wk":10.9,"src":"FBP","pwP":10.3},{"id":"luther-burden-iii","n":"Luther Burden III","p":"WR","t":"CHI","b":10,"a":57.8,"f":11.1,"st":16.5,"tot":182,"rk":20,"fv":205,"rkB":23,"pw":11.1,"pwF":10.7,"pwB":12.1,"wk":11.2,"src":"FBP","pwP":10.5},{"id":"dj-moore","n":"DJ Moore","p":"WR","t":"BUF","b":7,"a":58.9,"f":11.1,"st":17.0,"tot":188,"rk":17,"fv":205,"rkB":22,"pw":11.2,"pwF":11.1,"pwB":12.1,"wk":11.2,"src":"FBP","pwP":10.4},{"id":"tucker-kraft","n":"Tucker Kraft","p":"TE","t":"GB","b":11,"a":60.3,"f":10.1,"st":15.5,"tot":156,"rk":6,"fv":163,"rkB":7,"pw":9.5,"pwF":9.2,"pwB":9.6,"wk":9.8,"src":"FBP","pwP":9.8},{"id":"bhayshul-tuten","n":"Bhayshul Tuten","p":"RB","t":"JAX","b":7,"a":61.2,"f":11.3,"st":16.0,"tot":181,"rk":18,"fv":181,"rkB":27,"pw":10.3,"pwF":10.6,"pwB":10.6,"wk":10.6,"src":"FBP","pwP":9.8},{"id":"sam-laporta","n":"Sam LaPorta","p":"TE","t":"DET","b":6,"a":63.2,"f":9.0,"st":16.0,"tot":144,"rk":10,"fv":154,"rkB":12,"pw":9.0,"pwF":8.5,"pwB":9.1,"wk":9.2,"src":"FBP","pwP":9.5},{"id":"jadarian-price","n":"Jadarian Price","p":"RB","t":"SEA","b":11,"a":63.7,"f":11.5,"st":7.0,"tot":184,"rk":21,"fv":187,"rkB":26,"pw":10.4,"pwF":10.8,"pwB":11.0,"wk":8.7,"src":"FBP","fl":"P","pwP":9.4},{"id":"jameson-williams","n":"Jameson Williams","p":"WR","t":"DET","b":6,"a":65.5,"f":10.3,"st":16.5,"tot":169,"rk":27,"fv":215,"rkB":15,"pw":11.0,"pwF":9.9,"pwB":12.6,"wk":11.2,"src":"FBP","pwP":10.6},{"id":"rome-odunze","n":"Rome Odunze","p":"WR","t":"CHI","b":10,"a":66.5,"f":10.1,"st":16.5,"tot":167,"rk":26,"fv":186,"rkB":30,"pw":10.2,"pwF":9.8,"pwB":10.9,"wk":10.3,"src":"FBP","pwP":10.0},{"id":"caleb-williams","n":"Caleb Williams","p":"QB","t":"CHI","b":10,"a":66.6,"f":17.7,"st":16.5,"tot":291,"rk":7,"fv":346,"rkB":10,"pw":18.0,"pwF":17.1,"pwB":20.4,"wk":18.2,"src":"FBP","pwP":16.4},{"id":"treveyon-henderson","n":"TreVeyon Henderson","p":"RB","t":"NE","b":11,"a":67.2,"f":9.1,"st":14.0,"tot":128,"rk":37,"fv":187,"rkB":25,"pw":9.4,"pwF":7.5,"pwB":11.0,"wk":9.9,"src":"FBP","fl":"g","pwP":9.7},{"id":"christian-watson","n":"Christian Watson","p":"WR","t":"GB","b":11,"a":67.7,"f":10.6,"st":16.0,"tot":169,"rk":25,"fv":183,"rkB":32,"pw":10.4,"pwF":9.9,"pwB":10.8,"wk":10.6,"src":"FBP","pwP":10.5},{"id":"mike-evans","n":"Mike Evans","p":"WR","t":"SF","b":8,"a":69.7,"f":10.0,"st":15.0,"tot":150,"rk":34,"fv":184,"rkB":31,"pw":9.8,"pwF":8.8,"pwB":10.8,"wk":10.2,"src":"FBP","pwP":9.9},{"id":"justin-herbert","n":"Justin Herbert","p":"QB","t":"LAC","b":7,"a":70.3,"f":16.9,"st":16.4,"tot":277,"rk":14,"fv":348,"rkB":8,"pw":17.9,"pwF":16.3,"pwB":20.5,"wk":18.1,"src":"FBP","pwP":16.8},{"id":"harold-fannin-jr","n":"Harold Fannin Jr.","p":"TE","t":"CLE","b":11,"a":70.7,"f":8.9,"st":17.0,"tot":151,"rk":5,"fv":161,"rkB":9,"pw":9.3,"pwF":8.9,"pwB":9.5,"wk":9.3,"src":"FBP","pwP":9.5},{"id":"kyle-pitts-sr","n":"Kyle Pitts Sr.","p":"TE","t":"ATL","b":11,"a":72.1,"f":7.8,"st":17.0,"tot":133,"rk":11,"fv":169,"rkB":6,"pw":8.9,"pwF":7.8,"pwB":9.9,"wk":8.9,"src":"FBP","pwP":9.0},{"id":"dak-prescott","n":"Dak Prescott","p":"QB","t":"DAL","b":14,"a":73.1,"f":17.9,"st":15.8,"tot":282,"rk":10,"fv":351,"rkB":7,"pw":17.8,"pwF":16.6,"pwB":20.6,"wk":18.2,"src":"FBP","pwP":16.1},{"id":"jaylen-warren","n":"Jaylen Warren","p":"RB","t":"PIT","b":9,"a":76.0,"f":9.1,"st":16.0,"tot":146,"rk":31,"fv":205,"rkB":22,"pw":9.9,"pwF":8.6,"pwB":12.1,"wk":10.0,"src":"FBP","pwP":8.9},{"id":"rhamondre-stevenson","n":"Rhamondre Stevenson","p":"RB","t":"NE","b":11,"a":76.9,"f":10.8,"st":16.0,"tot":174,"rk":24,"fv":194,"rkB":24,"pw":10.7,"pwF":10.2,"pwB":11.4,"wk":10.9,"src":"FBP","pwP":10.4},{"id":"parker-washington","n":"Parker Washington","p":"WR","t":"JAX","b":7,"a":77.0,"f":10.3,"st":16.5,"tot":170,"rk":23,"fv":186,"rkB":29,"pw":10.3,"pwF":10.0,"pwB":10.9,"wk":10.4,"src":"FBP","pwP":10.1},{"id":"marvin-harrison-jr","n":"Marvin Harrison Jr.","p":"WR","t":"ARI","b":14,"a":78.2,"f":8.9,"st":17.0,"tot":151,"rk":32,"fv":171,"rkB":37,"pw":9.2,"pwF":8.9,"pwB":10.1,"wk":9.2,"src":"FBP","pwP":8.7},{"id":"carnell-tate","n":"Carnell Tate","p":"WR","t":"TEN","b":9,"a":81.7,"f":7.1,"st":16.5,"tot":117,"rk":51,"fv":188,"rkB":28,"pw":9.4,"pwF":6.9,"pwB":11.1,"wk":9.5,"src":"FBP","fl":"P","pwP":10.3},{"id":"george-kittle","n":"George Kittle","p":"TE","t":"SF","b":8,"a":82.5,"f":9.9,"st":15.5,"tot":153,"rk":7,"fv":170,"rkB":5,"pw":10.3,"pwF":9.0,"pwB":10.0,"wk":10.6,"src":"FBP","pwP":11.8},{"id":"trevor-lawrence","n":"Trevor Lawrence","p":"QB","t":"JAX","b":7,"a":83.6,"f":17.5,"st":16.5,"tot":289,"rk":4,"fv":346,"rkB":9,"pw":18.0,"pwF":17.0,"pwB":20.4,"wk":18.1,"src":"FBP","pwP":16.5},{"id":"brian-thomas-jr","n":"Brian Thomas Jr.","p":"WR","t":"JAX","b":7,"a":84.0,"f":9.1,"st":16.5,"tot":149,"rk":35,"fv":183,"rkB":33,"pw":9.4,"pwF":8.8,"pwB":10.8,"wk":9.5,"src":"FBP","pwP":8.5},{"id":"dk-metcalf","n":"DK Metcalf","p":"WR","t":"PIT","b":9,"a":85.6,"f":9.6,"st":16.0,"tot":154,"rk":30,"fv":194,"rkB":27,"pw":9.9,"pwF":9.1,"pwB":11.4,"wk":10.1,"src":"FBP","pwP":9.2},{"id":"tony-pollard","n":"Tony Pollard","p":"RB","t":"TEN","b":9,"a":86.0,"f":9.3,"st":16.5,"tot":154,"rk":28,"fv":176,"rkB":29,"pw":9.7,"pwF":9.1,"pwB":10.4,"wk":9.8,"src":"FBP","pwP":9.6},{"id":"rico-dowdle","n":"Rico Dowdle","p":"RB","t":"PIT","b":9,"a":86.4,"f":11.0,"st":16.3,"tot":179,"rk":23,"fv":175,"rkB":30,"pw":10.2,"pwF":10.5,"pwB":10.3,"wk":10.4,"src":"FBP","pwP":9.8},{"id":"rams-def","n":"Rams","p":"DEF","t":"LAR","b":11,"a":87.2,"f":7.6,"st":17.0,"tot":130,"rk":3,"fv":157,"rkB":5,"pw":8.0,"pwF":7.6,"pwB":9.2,"wk":8.0,"src":"FBP","pwP":7.1},{"id":"brandon-aubrey","n":"Brandon Aubrey","p":"K","t":"DAL","b":14,"a":87.4,"f":8.7,"st":17.0,"tot":147,"rk":1,"fv":157,"rkB":1,"pw":9.0,"pwF":8.6,"pwB":9.2,"wk":9.0,"src":"FBP","pwP":9.1},{"id":"chuba-hubbard","n":"Chuba Hubbard","p":"RB","t":"CAR","b":5,"a":90.6,"f":8.8,"st":15.5,"tot":137,"rk":33,"fv":163,"rkB":34,"pw":8.5,"pwF":8.1,"pwB":9.6,"wk":8.8,"src":"FBP","fl":"g","pwP":7.9},{"id":"jonathon-brooks","n":"Jonathon Brooks","p":"RB","t":"CAR","b":5,"a":91.1,"f":8.3,"st":15.0,"tot":124,"rk":39,"fv":165,"rkB":33,"pw":9.0,"pwF":7.3,"pwB":9.7,"wk":9.3,"src":"FBP","fl":"g","pwP":9.9},{"id":"jaxson-dart","n":"Jaxson Dart","p":"QB","t":"NYG","b":8,"a":92.7,"f":17.8,"st":15.0,"tot":267,"rk":17,"fv":332,"rkB":17,"pw":17.1,"pwF":15.7,"pwB":19.5,"wk":17.8,"src":"FBP","pwP":16.0},{"id":"marshawn-lloyd","n":"MarShawn Lloyd","p":"RB","t":"GB","b":11,"a":93.5,"f":10.4,"st":7.0,"tot":156,"rk":29,"fv":181,"rkB":28,"pw":10.6,"pwF":9.2,"pwB":10.6,"wk":9.2,"src":"FBP","fl":"Q","pwP":11.9},{"id":"texans-def","n":"Texans","p":"DEF","t":"HOU","b":8,"a":94.1,"f":7.7,"st":17.0,"tot":130,"rk":1,"fv":182,"rkB":1,"pw":8.4,"pwF":7.6,"pwB":10.7,"wk":8.5,"src":"FBP","pwP":7.0},{"id":"jk-dobbins","n":"J.K. Dobbins","p":"RB","t":"DEN","b":10,"a":94.6,"f":9.4,"st":15.0,"tot":140,"rk":36,"fv":166,"rkB":32,"pw":9.0,"pwF":8.2,"pwB":9.8,"wk":9.4,"src":"FBP","pwP":9.0},{"id":"travis-kelce","n":"Travis Kelce","p":"TE","t":"KC","b":5,"a":94.9,"f":7.8,"st":15.5,"tot":121,"rk":15,"fv":163,"rkB":8,"pw":8.5,"pwF":7.1,"pwB":9.6,"wk":8.7,"src":"FBP","pwP":8.8},{"id":"chris-godwin-jr","n":"Chris Godwin Jr.","p":"WR","t":"TB","b":10,"a":95.3,"f":8.5,"st":16.0,"tot":136,"rk":41,"fv":170,"rkB":38,"pw":8.7,"pwF":8.0,"pwB":10.0,"wk":8.9,"src":"FBP","pwP":8.2},{"id":"alec-pierce","n":"Alec Pierce","p":"WR","t":"IND","b":13,"a":96.0,"f":8.8,"st":15.0,"tot":132,"rk":45,"fv":179,"rkB":35,"pw":8.9,"pwF":7.8,"pwB":10.5,"wk":9.2,"src":"FBP","fl":"g","pwP":8.4},{"id":"dalton-kincaid","n":"Dalton Kincaid","p":"TE","t":"BUF","b":7,"a":97.5,"f":8.3,"st":16.0,"tot":132,"rk":16,"fv":141,"rkB":14,"pw":8.2,"pwF":7.8,"pwB":8.3,"wk":8.3,"src":"FBP","pwP":8.4},{"id":"brock-purdy","n":"Brock Purdy","p":"QB","t":"SF","b":8,"a":98.4,"f":17.8,"st":16.0,"tot":285,"rk":6,"fv":341,"rkB":13,"pw":17.8,"pwF":16.8,"pwB":20.1,"wk":18.2,"src":"FBP","pwP":16.6},{"id":"bo-nix","n":"Bo Nix","p":"QB","t":"DEN","b":10,"a":98.7,"f":17.9,"st":16.0,"tot":287,"rk":9,"fv":342,"rkB":11,"pw":17.7,"pwF":16.9,"pwB":20.1,"wk":18.0,"src":"FBP","pwP":16.1},{"id":"blake-corum","n":"Blake Corum","p":"RB","t":"LAR","b":11,"a":99.5,"f":13.7,"st":2.0,"tot":140,"rk":34,"fv":151,"rkB":39,"pw":8.4,"pwF":8.2,"pwB":8.9,"wk":6.3,"src":"FBP","pwP":8.0},{"id":"matthew-stafford","n":"Matthew Stafford","p":"QB","t":"LAR","b":11,"a":99.6,"f":17.3,"st":15.9,"tot":274,"rk":15,"fv":342,"rkB":12,"pw":17.2,"pwF":16.1,"pwB":20.1,"wk":17.6,"src":"FBP","pwP":15.5},{"id":"michael-wilson","n":"Michael Wilson","p":"WR","t":"ARI","b":14,"a":100.5,"f":9.5,"st":17.0,"tot":161,"rk":28,"fv":166,"rkB":41,"pw":9.3,"pwF":9.5,"pwB":9.8,"wk":9.3,"src":"FBP","pwP":8.7},{"id":"jordyn-tyson","n":"Jordyn Tyson","p":"WR","t":"NO","b":8,"a":101.7,"f":5.2,"st":10.0,"tot":52,"rk":97,"fv":119,"rkB":65,"pw":6.3,"pwF":3.1,"pwB":7.0,"wk":6.5,"src":"FBP","fl":"Pg","pwP":8.9},{"id":"broncos-def","n":"Broncos","p":"DEF","t":"DEN","b":10,"a":102.5,"f":7.2,"st":17.0,"tot":123,"rk":4,"fv":170,"rkB":2,"pw":7.9,"pwF":7.2,"pwB":10.0,"wk":7.9,"src":"FBP","pwP":6.4},{"id":"patrick-mahomes","n":"Patrick Mahomes","p":"QB","t":"KC","b":5,"a":103.8,"f":17.4,"st":16.0,"tot":278,"rk":11,"fv":337,"rkB":14,"pw":17.4,"pwF":16.4,"pwB":19.8,"wk":17.8,"src":"FBP","fl":"g","pwP":16.1},{"id":"stefon-diggs","n":"Stefon Diggs","p":"WR","t":"WAS","b":7,"a":104.8,"f":8.5,"st":15.6,"tot":132,"rk":43,"fv":151,"rkB":46,"pw":8.1,"pwF":7.8,"pwB":8.9,"wk":8.4,"src":"FBP","pwP":7.7},{"id":"dallas-goedert","n":"Dallas Goedert","p":"TE","t":"PHI","b":10,"a":105.1,"f":8.9,"st":16.0,"tot":142,"rk":9,"fv":148,"rkB":13,"pw":8.3,"pwF":8.4,"pwB":8.7,"wk":8.4,"src":"FBP","pwP":7.7},{"id":"josh-downs","n":"Josh Downs","p":"WR","t":"IND","b":13,"a":106.0,"f":7.3,"st":15.5,"tot":113,"rk":55,"fv":156,"rkB":45,"pw":7.9,"pwF":6.6,"pwB":9.2,"wk":8.2,"src":"FBP","pwP":8.0},{"id":"courtland-sutton","n":"Courtland Sutton","p":"WR","t":"DEN","b":10,"a":106.2,"f":9.0,"st":16.0,"tot":144,"rk":38,"fv":172,"rkB":36,"pw":8.9,"pwF":8.5,"pwB":10.1,"wk":9.1,"src":"FBP","pwP":8.2},{"id":"jacory-croskey-merritt","n":"Jacory Croskey-Merritt","p":"RB","t":"WAS","b":7,"a":106.4,"f":7.8,"st":15.0,"tot":118,"rk":44,"fv":156,"rkB":37,"pw":8.3,"pwF":6.9,"pwB":9.2,"wk":8.6,"src":"FBP","pwP":8.8},{"id":"quentin-johnston","n":"Quentin Johnston","p":"WR","t":"LAC","b":7,"a":108.8,"f":7.1,"st":17.0,"tot":120,"rk":50,"fv":168,"rkB":40,"pw":8.4,"pwF":7.1,"pwB":9.9,"wk":8.4,"src":"FBP","pwP":8.1},{"id":"dezhaun-stribling","n":"De'Zhaun Stribling","p":"WR","t":"SF","b":8,"a":108.8,"f":7.3,"st":16.5,"tot":120,"rk":49,"fv":129,"rkB":58,"pw":7.4,"pwF":7.1,"pwB":7.6,"wk":7.5,"src":"FBP","fl":"PQ","pwP":7.5},{"id":"seahawks-def","n":"Seahawks","p":"DEF","t":"SEA","b":11,"a":108.9,"f":6.9,"st":17.0,"tot":118,"rk":2,"fv":168,"rkB":3,"pw":7.8,"pwF":6.9,"pwB":9.9,"wk":7.8,"src":"FBP","pwP":6.6},{"id":"rj-harvey","n":"RJ Harvey","p":"RB","t":"DEN","b":10,"a":109.2,"f":10.7,"st":2.0,"tot":131,"rk":32,"fv":153,"rkB":38,"pw":8.2,"pwF":7.7,"pwB":9.0,"wk":6.1,"src":"FBP","pwP":7.9},{"id":"isaiah-likely","n":"Isaiah Likely","p":"TE","t":"NYG","b":8,"a":109.5,"f":7.4,"st":17.0,"tot":125,"rk":17,"fv":160,"rkB":10,"pw":8.3,"pwF":7.4,"pwB":9.4,"wk":8.3,"src":"FBP","pwP":8.2},{"id":"kyle-monangai","n":"Kyle Monangai","p":"RB","t":"CHI","b":10,"a":110.0,"f":8.3,"st":14.5,"tot":121,"rk":43,"fv":143,"rkB":41,"pw":7.5,"pwF":7.1,"pwB":8.4,"wk":7.9,"src":"FBP","fl":"g","pwP":6.9},{"id":"jordan-mason","n":"Jordan Mason","p":"RB","t":"MIN","b":6,"a":112.0,"f":9.8,"st":15.5,"tot":152,"rk":30,"fv":161,"rkB":35,"pw":9.1,"pwF":8.9,"pwB":9.5,"wk":9.4,"src":"FBP","pwP":8.8},{"id":"kyler-murray","n":"Kyler Murray","p":"QB","t":"MIN","b":6,"a":112.8,"f":16.0,"st":16.0,"tot":256,"rk":18,"fv":335,"rkB":15,"pw":17.0,"pwF":15.1,"pwB":19.7,"wk":17.3,"src":"FBP","pwP":16.2},{"id":"mark-andrews","n":"Mark Andrews","p":"TE","t":"BAL","b":13,"a":113.3,"f":7.8,"st":16.5,"tot":128,"rk":13,"fv":155,"rkB":11,"pw":8.3,"pwF":7.5,"pwB":9.1,"wk":8.4,"src":"FBP","pwP":8.4},{"id":"jared-goff","n":"Jared Goff","p":"QB","t":"DET","b":6,"a":113.4,"f":16.6,"st":16.7,"tot":277,"rk":12,"fv":334,"rkB":16,"pw":17.1,"pwF":16.3,"pwB":19.6,"wk":17.2,"src":"FBP","pwP":15.5},{"id":"ricky-pearsall","n":"Ricky Pearsall","p":"WR","t":"SF","b":8,"a":114.9,"src":"none"},{"id":"jordan-addison","n":"Jordan Addison","p":"WR","t":"MIN","b":6,"a":115.4,"f":8.8,"st":17.0,"tot":149,"rk":36,"fv":158,"rkB":44,"pw":8.3,"pwF":8.8,"pwB":9.3,"wk":8.3,"src":"FBP","pwP":6.9},{"id":"aaron-rodgers","n":"Aaron Rodgers","p":"QB","t":"PIT","b":9,"a":115.8,"f":13.4,"st":15.0,"tot":201,"rk":30,"fv":281,"rkB":24,"pw":14.1,"pwF":11.8,"pwB":16.5,"wk":14.6,"src":"FBP","pwP":14.0},{"id":"jayden-reed","n":"Jayden Reed","p":"WR","t":"GB","b":11,"a":116.1,"f":9.7,"st":15.3,"tot":148,"rk":31,"fv":165,"rkB":42,"pw":8.9,"pwF":8.7,"pwB":9.7,"wk":9.2,"src":"FBP","pwP":8.2},{"id":"jake-ferguson","n":"Jake Ferguson","p":"TE","t":"DAL","b":14,"a":117.4,"f":8.4,"st":16.5,"tot":139,"rk":8,"fv":132,"rkB":16,"pw":8.0,"pwF":8.2,"pwB":7.8,"wk":8.1,"src":"FBP","pwP":8.0},{"id":"makai-lemon","n":"Makai Lemon","p":"WR","t":"PHI","b":10,"a":117.5,"f":6.1,"st":15.0,"tot":92,"rk":69,"fv":128,"rkB":61,"pw":7.0,"pwF":5.4,"pwB":7.5,"wk":7.3,"src":"FBP","fl":"P","pwP":8.2},{"id":"fernando-mendoza","n":"Fernando Mendoza","p":"QB","t":"LV","b":13,"a":118.4,"f":14.5,"st":8.0,"tot":117,"rk":33,"fv":222,"rkB":32,"pw":9.8,"pwF":6.9,"pwB":13.1,"wk":10.2,"src":"FBP","fl":"P","pwP":9.3},{"id":"brian-robinson","n":"Brian Robinson","p":"RB","t":"ATL","b":11,"a":118.6,"f":15.4,"st":1.0,"tot":100,"rk":52,"fv":107,"rkB":48,"pw":6.3,"pwF":5.9,"pwB":6.3,"wk":4.7,"src":"FBP","pwP":6.6},{"id":"kaimi-fairbairn","n":"Ka'imi Fairbairn","p":"K","t":"HOU","b":8,"a":118.8,"f":8.6,"st":16.4,"tot":141,"rk":3,"fv":152,"rkB":2,"pw":8.6,"pwF":8.3,"pwB":8.9,"wk":8.7,"src":"FBP","pwP":8.6},{"id":"cooper-kupp","n":"Cooper Kupp","p":"WR","t":"SEA","b":11,"a":120.0,"f":5.6,"st":16.0,"tot":89,"rk":71,"fv":97,"rkB":79,"pw":5.3,"pwF":5.2,"pwB":5.7,"wk":5.4,"src":"FBP","pwP":5.0},{"id":"kenny-gainwell","n":"Kenny Gainwell","p":"RB","t":"TB","b":10,"a":120.1,"f":9.4,"st":16.5,"tot":155,"rk":26,"fv":169,"rkB":31,"pw":9.1,"pwF":9.1,"pwB":9.9,"wk":9.2,"src":"FBP","pwP":8.3},{"id":"michael-pittman-jr","n":"Michael Pittman Jr.","p":"WR","t":"PIT","b":9,"a":121.0,"f":7.7,"st":16.0,"tot":123,"rk":47,"fv":181,"rkB":34,"pw":8.7,"pwF":7.2,"pwB":10.6,"wk":8.8,"src":"FBP","pwP":8.2},{"id":"bryce-young","n":"Bryce Young","p":"QB","t":"CAR","b":5,"a":121.5,"f":14.7,"st":15.5,"tot":228,"rk":27,"fv":279,"rkB":25,"pw":14.6,"pwF":13.4,"pwB":16.4,"wk":15.1,"src":"FBP","pwP":14.1},{"id":"jason-myers","n":"Jason Myers","p":"K","t":"SEA","b":11,"a":121.8,"f":8.0,"st":17.0,"tot":136,"rk":5,"fv":151,"rkB":4,"pw":8.6,"pwF":8.0,"pwB":8.9,"wk":8.6,"src":"FBP","pwP":8.9},{"id":"sam-darnold","n":"Sam Darnold","p":"QB","t":"SEA","b":11,"a":122.4,"f":14.6,"st":16.0,"tot":234,"rk":22,"fv":279,"rkB":26,"pw":15.1,"pwF":13.8,"pwB":16.4,"wk":15.4,"src":"FBP","pwP":15.1},{"id":"jordan-love","n":"Jordan Love","p":"QB","t":"GB","b":11,"a":122.6,"f":16.1,"st":16.0,"tot":258,"rk":20,"fv":319,"rkB":19,"pw":16.4,"pwF":15.2,"pwB":18.8,"wk":16.7,"src":"FBP","pwP":15.3},{"id":"kc-concepcion","n":"KC Concepcion","p":"WR","t":"CLE","b":11,"a":123.2,"f":6.6,"st":16.5,"tot":109,"rk":60,"fv":150,"rkB":47,"pw":7.7,"pwF":6.4,"pwB":8.8,"wk":7.8,"src":"FBP","fl":"P","pwP":7.9},{"id":"juwan-johnson","n":"Juwan Johnson","p":"TE","t":"NO","b":8,"a":123.3,"f":7.4,"st":17.0,"tot":126,"rk":14,"fv":137,"rkB":15,"pw":7.4,"pwF":7.4,"pwB":8.1,"wk":7.4,"src":"FBP","pwP":6.8},{"id":"pat-freiermuth","n":"Pat Freiermuth","p":"TE","t":"PIT","b":9,"a":123.4,"f":6.8,"st":17.0,"tot":116,"rk":24,"fv":107,"rkB":26,"pw":6.3,"pwF":6.8,"pwB":6.3,"wk":6.3,"src":"FBP","pwP":5.7},{"id":"mike-washington-jr","n":"Mike Washington Jr.","p":"RB","t":"LV","b":13,"a":123.5,"f":13.2,"st":3.0,"tot":118,"rk":40,"fv":105,"rkB":49,"pw":5.8,"pwF":6.9,"pwB":6.2,"wk":4.4,"src":"FBP","fl":"P","pwP":4.3},{"id":"ray-davis","n":"Ray Davis","p":"RB","t":"BUF","b":7,"a":123.7,"f":15.1,"st":2.0,"tot":104,"rk":48,"fv":78,"rkB":61,"pw":4.6,"pwF":6.1,"pwB":4.6,"wk":3.3,"src":"FBP","fl":"Q","pwP":3.2},{"id":"eagles-def","n":"Eagles","p":"DEF","t":"PHI","b":10,"a":123.8,"f":6.4,"st":17.0,"tot":109,"rk":7,"fv":148,"rkB":9,"pw":7.4,"pwF":6.4,"pwB":8.7,"wk":7.4,"src":"FBP","pwP":7.0},{"id":"david-njoku","n":"David Njoku","p":"TE","t":"LAC","b":7,"a":123.8,"f":3.6,"st":16.0,"tot":57,"rk":39,"fv":68,"rkB":36,"pw":3.6,"pwF":3.4,"pwB":4.0,"wk":3.6,"src":"FBP","pwP":3.3},{"id":"cameron-dicker","n":"Cameron Dicker","p":"K","t":"LAC","b":7,"a":123.9,"f":8.4,"st":17.0,"tot":144,"rk":2,"fv":151,"rkB":3,"pw":8.8,"pwF":8.5,"pwB":8.9,"wk":8.7,"src":"FBP","pwP":8.9},{"id":"cam-ward","n":"Cam Ward","p":"QB","t":"TEN","b":9,"a":124.0,"f":14.6,"st":16.0,"tot":233,"rk":24,"fv":269,"rkB":27,"pw":14.2,"pwF":13.7,"pwB":15.8,"wk":14.5,"src":"FBP","pwP":13.1},{"id":"isaac-teslaa","n":"Isaac TeSlaa","p":"WR","t":"DET","b":6,"a":124.2,"f":3.2,"st":17.0,"tot":55,"rk":95,"fv":92,"rkB":81,"pw":4.2,"pwF":3.2,"pwB":5.4,"wk":4.2,"src":"FBP","fl":"Q","pwP":4.1},{"id":"rachaad-white","n":"Rachaad White","p":"RB","t":"WAS","b":7,"a":124.3,"f":7.0,"st":15.0,"tot":104,"rk":42,"fv":149,"rkB":40,"pw":6.8,"pwF":6.1,"pwB":8.8,"wk":7.1,"src":"FBP","pwP":5.4},{"id":"aaron-jones-sr","n":"Aaron Jones Sr.","p":"RB","t":"MIN","b":6,"a":124.3,"f":6.6,"st":15.0,"tot":99,"rk":45,"fv":156,"rkB":36,"pw":7.3,"pwF":5.8,"pwB":9.2,"wk":7.6,"src":"FBP","pwP":6.9},{"id":"kayshon-boutte","n":"Kayshon Boutte","p":"WR","t":"HOU","b":8,"a":124.7,"f":6.1,"st":17.0,"tot":104,"rk":64,"fv":129,"rkB":59,"pw":7.0,"pwF":6.1,"pwB":7.6,"wk":7.0,"src":"FBP","fl":"Q","pwP":7.3},{"id":"malik-willis","n":"Malik Willis","p":"QB","t":"MIA","b":6,"a":125.1,"f":15.1,"st":16.0,"tot":241,"rk":21,"fv":294,"rkB":23,"pw":15.6,"pwF":14.2,"pwB":17.3,"wk":15.9,"src":"FBP","pwP":15.4},{"id":"aj-barner","n":"AJ Barner","p":"TE","t":"SEA","b":11,"a":125.3,"f":7.0,"st":17.0,"tot":119,"rk":22,"fv":117,"rkB":23,"pw":6.7,"pwF":7.0,"pwB":6.9,"wk":6.7,"src":"FBP","pwP":6.3},{"id":"travis-hunter","n":"Travis Hunter","p":"WR","t":"JAX","b":7,"a":125.3,"f":4.0,"st":15.0,"tot":59,"rk":93,"fv":87,"rkB":84,"pw":4.3,"pwF":3.5,"pwB":5.1,"wk":4.5,"src":"FB"},{"id":"isiah-pacheco","n":"Isiah Pacheco","p":"RB","t":"DET","b":6,"a":125.4,"f":13.3,"st":3.0,"tot":40,"rk":78,"fv":55,"rkB":73,"pw":3.6,"pwF":2.4,"pwB":3.2,"wk":3.8,"src":"FBP","pwP":5.3},{"id":"james-conner","n":"James Conner","p":"RB","t":"ARI","b":14,"a":125.4,"f":3.0,"st":11.0,"tot":33,"rk":81,"fv":52,"rkB":78,"pw":2.1,"pwF":1.9,"pwB":3.1,"wk":2.2,"src":"FBP","pwP":1.2},{"id":"keenan-allen","n":"Keenan Allen","p":"WR","t":"IND","b":13,"a":125.5,"f":5.7,"st":16.0,"tot":91,"rk":67,"fv":120,"rkB":64,"pw":5.9,"pwF":5.4,"pwB":7.1,"wk":6.0,"src":"FBP","pwP":5.2},{"id":"matthew-golden","n":"Matthew Golden","p":"WR","t":"GB","b":11,"a":125.6,"f":8.3,"st":17.0,"tot":142,"rk":39,"fv":170,"rkB":39,"pw":8.6,"pwF":8.4,"pwB":10.0,"wk":8.6,"src":"FBP","pwP":7.5},{"id":"cj-stroud","n":"C.J. Stroud","p":"QB","t":"HOU","b":8,"a":125.7,"f":14.8,"st":16.0,"tot":237,"rk":23,"fv":310,"rkB":22,"pw":15.7,"pwF":13.9,"pwB":18.2,"wk":16.0,"src":"FBP","pwP":15.0},{"id":"baker-mayfield","n":"Baker Mayfield","p":"QB","t":"TB","b":10,"a":125.8,"f":16.1,"st":16.5,"tot":265,"rk":16,"fv":323,"rkB":18,"pw":16.7,"pwF":15.6,"pwB":19.0,"wk":16.9,"src":"FBP","pwP":15.6},{"id":"alvin-kamara","n":"Alvin Kamara","p":"RB","t":"NO","b":8,"a":125.8,"f":4.5,"st":14.0,"tot":63,"rk":63,"fv":91,"rkB":57,"pw":4.8,"pwF":3.7,"pwB":5.4,"wk":5.0,"src":"FBP","pwP":5.2},{"id":"jauan-jennings","n":"Jauan Jennings","p":"WR","t":"MIN","b":6,"a":125.8,"f":4.5,"st":17.0,"tot":76,"rk":77,"fv":105,"rkB":73,"pw":6.0,"pwF":4.5,"pwB":6.2,"wk":6.0,"src":"FBP","pwP":7.3},{"id":"dalton-schultz","n":"Dalton Schultz","p":"TE","t":"HOU","b":8,"a":126.3,"f":7.5,"st":17.0,"tot":128,"rk":12,"fv":117,"rkB":24,"pw":6.8,"pwF":7.5,"pwB":6.9,"wk":6.8,"src":"FBP","pwP":6.1},{"id":"49ers-def","n":"49ers","p":"DEF","t":"SF","b":8,"a":126.3,"f":5.6,"st":17.0,"tot":96,"rk":22,"pw":6.2,"pwF":5.6,"wk":6.2,"src":"FP","pwP":6.7},{"id":"emmett-johnson","n":"Emmett Johnson","p":"RB","t":"KC","b":5,"a":126.4,"f":13.3,"st":2.0,"tot":103,"rk":46,"fv":83,"rkB":60,"pw":4.6,"pwF":6.1,"pwB":4.9,"wk":3.2,"src":"FBP","fl":"PQ","pwP":2.8},{"id":"chig-okonkwo","n":"Chig Okonkwo","p":"TE","t":"WAS","b":7,"a":126.5,"f":7.4,"st":17.0,"tot":125,"rk":19,"fv":122,"rkB":20,"pw":7.2,"pwF":7.4,"pwB":7.2,"wk":7.2,"src":"FBP","pwP":7.0},{"id":"oronde-gadsden","n":"Oronde Gadsden","p":"TE","t":"LAC","b":7,"a":126.5,"f":2.9,"st":17.0,"tot":49,"rk":42,"fv":80,"rkB":32,"pw":3.3,"pwF":2.9,"pwB":4.7,"wk":3.3,"src":"FBP","pwP":2.2},{"id":"bears-def","n":"Bears","p":"DEF","t":"CHI","b":10,"a":126.5,"f":6.1,"st":17.0,"tot":104,"rk":14,"fv":135,"rkB":17,"pw":6.7,"pwF":6.1,"pwB":7.9,"wk":6.7,"src":"FBP","pwP":6.1},{"id":"jakobi-lane","n":"Ja'Kobi Lane","p":"WR","t":"BAL","b":13,"a":126.8,"f":7.3,"st":17.0,"tot":124,"rk":48,"fv":96,"rkB":80,"pw":5.9,"pwF":7.3,"pwB":5.6,"wk":5.9,"src":"FBP","fl":"P","pwP":4.7},{"id":"terrance-ferguson","n":"Terrance Ferguson","p":"TE","t":"LAR","b":11,"a":127.0,"f":5.2,"st":17.0,"tot":88,"rk":32,"fv":117,"rkB":22,"pw":5.8,"pwF":5.2,"pwB":6.9,"wk":5.8,"src":"FBP","pwP":5.4},{"id":"daniel-jones","n":"Daniel Jones","p":"QB","t":"IND","b":13,"a":127.2,"f":14.3,"st":16.0,"tot":229,"rk":25,"fv":317,"rkB":20,"pw":15.5,"pwF":13.5,"pwB":18.6,"wk":15.8,"src":"FBP","fl":"g","pwP":14.4},{"id":"deebo-samuel-sr","n":"Deebo Samuel Sr.","p":"WR","t":"SF","b":8,"a":127.3,"f":7.6,"st":15.5,"tot":118,"rk":52,"fv":137,"rkB":51,"pw":7.5,"pwF":6.9,"pwB":8.1,"wk":7.7,"src":"FBP","pwP":7.5},{"id":"braelon-allen","n":"Braelon Allen","p":"RB","t":"NYJ","b":13,"a":127.3,"f":10.9,"st":2.0,"tot":93,"rk":56,"fv":101,"rkB":52,"pw":5.0,"pwF":5.5,"pwB":5.9,"wk":3.7,"src":"FBP","pwP":3.7},{"id":"hunter-henry","n":"Hunter Henry","p":"TE","t":"NE","b":11,"a":127.5,"f":7.8,"st":16.5,"tot":129,"rk":18,"fv":130,"rkB":17,"pw":7.4,"pwF":7.6,"pwB":7.6,"wk":7.5,"src":"FBP","pwP":7.0},{"id":"giants-def","n":"Giants","p":"DEF","t":"NYG","b":8,"a":128.0,"f":5.9,"st":17.0,"tot":99,"rk":20,"fv":129,"rkB":21,"pw":6.6,"pwF":5.8,"pwB":7.6,"wk":6.7,"src":"FBP","pwP":6.5},{"id":"jake-elliott","n":"Jake Elliott","p":"K","t":"PHI","b":10,"a":128.1,"f":6.7,"st":16.5,"tot":111,"rk":23,"fv":131,"rkB":19,"pw":7.7,"pwF":6.5,"pwB":7.7,"wk":7.7,"src":"FBP","pwP":8.8},{"id":"tj-hockenson","n":"T.J. Hockenson","p":"TE","t":"MIN","b":6,"a":128.2,"f":7.2,"st":17.0,"tot":122,"rk":20,"fv":123,"rkB":19,"pw":6.8,"pwF":7.2,"pwB":7.2,"wk":6.8,"src":"FBP","pwP":6.1},{"id":"rashid-shaheed","n":"Rashid Shaheed","p":"WR","t":"SEA","b":11,"a":128.3,"f":6.8,"st":17.0,"tot":115,"rk":57,"fv":130,"rkB":56,"pw":7.4,"pwF":6.8,"pwB":7.6,"wk":7.4,"src":"FBP","pwP":7.8},{"id":"nick-folk","n":"Nick Folk","p":"K","t":"ATL","b":11,"a":128.3,"f":7.2,"st":17.0,"tot":122,"rk":18,"fv":136,"rkB":17,"pw":8.0,"pwF":7.2,"pwB":8.0,"wk":8.0,"src":"FBP","pwP":8.9},{"id":"tre-tucker","n":"Tre Tucker","p":"WR","t":"LV","b":13,"a":128.5,"f":4.3,"st":17.0,"tot":73,"rk":79,"fv":137,"rkB":52,"pw":6.6,"pwF":4.3,"pwB":8.1,"wk":6.6,"src":"FBP","pwP":7.3},{"id":"tyreek-hill","n":"Tyreek Hill","p":"WR","t":"MIA","b":6,"a":128.7,"fv":72,"rkB":96,"pw":4.2,"pwB":4.2,"wk":4.2,"src":"B"},{"id":"xavier-worthy","n":"Xavier Worthy","p":"WR","t":"KC","b":5,"a":129.1,"f":7.6,"st":15.5,"tot":118,"rk":54,"fv":145,"rkB":49,"pw":7.9,"pwF":6.9,"pwB":8.5,"wk":8.1,"src":"FBP","pwP":8.2},{"id":"jalen-nailor","n":"Jalen Nailor","p":"WR","t":"LV","b":13,"a":129.1,"f":6.2,"st":17.0,"tot":105,"rk":63,"fv":128,"rkB":60,"pw":6.9,"pwF":6.2,"pwB":7.5,"wk":6.9,"src":"FBP","pwP":6.9},{"id":"tank-bigsby","n":"Tank Bigsby","p":"RB","t":"PHI","b":10,"a":129.3,"f":14.0,"st":2.0,"tot":73,"rk":62,"fv":102,"rkB":51,"pw":5.1,"pwF":4.3,"pwB":6.0,"wk":4.4,"src":"FBP","fl":"Q","pwP":5.1},{"id":"jonah-coleman","n":"Jonah Coleman","p":"RB","t":"DEN","b":10,"a":129.3,"f":11.1,"st":2.0,"tot":83,"rk":58,"fv":95,"rkB":53,"pw":4.8,"pwF":4.9,"pwB":5.6,"wk":3.7,"src":"FBP","pwP":3.9},{"id":"brenton-strange","n":"Brenton Strange","p":"TE","t":"JAX","b":7,"a":129.5,"f":6.6,"st":17.0,"tot":112,"rk":25,"fv":129,"rkB":18,"pw":7.1,"pwF":6.6,"pwB":7.6,"wk":7.1,"src":"FBP","pwP":7.0},{"id":"bills-def","n":"Bills","p":"DEF","t":"BUF","b":7,"a":129.5,"f":6.3,"st":17.0,"tot":108,"rk":9,"fv":146,"rkB":10,"pw":7.2,"pwF":6.4,"pwB":8.6,"wk":7.1,"src":"FBP","pwP":6.5},{"id":"harrison-butker","n":"Harrison Butker","p":"K","t":"KC","b":5,"a":129.5,"f":7.4,"st":17.0,"tot":126,"rk":15,"fv":137,"rkB":13,"pw":8.1,"pwF":7.4,"pwB":8.1,"wk":8.1,"src":"FBP","pwP":8.8},{"id":"patriots-def","n":"Patriots","p":"DEF","t":"NE","b":11,"a":129.7,"f":6.4,"st":17.0,"tot":109,"rk":8,"fv":152,"rkB":7,"pw":7.3,"pwF":6.4,"pwB":8.9,"wk":7.3,"src":"FBP","pwP":6.7},{"id":"tyler-allgeier","n":"Tyler Allgeier","p":"RB","t":"ARI","b":14,"a":129.9,"f":9.7,"st":2.0,"tot":107,"rk":50,"fv":118,"rkB":45,"pw":5.7,"pwF":6.3,"pwB":6.9,"wk":4.0,"src":"FBP","pwP":3.8},{"id":"kaelon-black","n":"Kaelon Black","p":"RB","t":"SF","b":8,"a":130.0,"f":9.0,"st":2.0,"tot":54,"rk":69,"fv":65,"rkB":68,"pw":3.3,"pwF":3.2,"pwB":3.8,"wk":2.7,"src":"FBP","fl":"PQ","pwP":3.0},{"id":"kenyon-sadiq","n":"Kenyon Sadiq","p":"TE","t":"NYJ","b":13,"a":130.0,"f":5.8,"st":15.0,"tot":88,"rk":31,"fv":122,"rkB":21,"pw":6.4,"pwF":5.2,"pwB":7.2,"wk":6.6,"src":"FBP","fl":"P","pwP":6.7},{"id":"tyler-shough","n":"Tyler Shough","p":"QB","t":"NO","b":8,"a":130.1,"f":16.1,"st":16.0,"tot":258,"rk":19,"fv":310,"rkB":21,"pw":16.2,"pwF":15.2,"pwB":18.2,"wk":16.5,"src":"FBP","pwP":15.1},{"id":"trey-smack","n":"Trey Smack","p":"K","t":"GB","b":11,"a":130.3,"f":7.6,"st":17.0,"tot":129,"rk":11,"fv":126,"rkB":20,"pw":7.9,"pwF":7.6,"pwB":7.4,"wk":7.9,"src":"FBP","fl":"P","pwP":8.7},{"id":"jakobi-meyers","n":"Jakobi Meyers","p":"WR","t":"JAX","b":7,"a":130.4,"f":7.8,"st":16.0,"tot":125,"rk":46,"fv":145,"rkB":50,"pw":7.7,"pwF":7.4,"pwB":8.5,"wk":7.9,"src":"FBP","fl":"g","pwP":7.3},{"id":"cam-little","n":"Cam Little","p":"K","t":"JAX","b":7,"a":130.5,"f":8.1,"st":17.0,"tot":138,"rk":4,"fv":142,"rkB":9,"pw":8.5,"pwF":8.1,"pwB":8.4,"wk":8.5,"src":"FBP","pwP":9.0},{"id":"chris-rodriguez-jr","n":"Chris Rodriguez Jr.","p":"RB","t":"JAX","b":7,"a":130.6,"f":8.0,"st":16.0,"tot":128,"rk":38,"fv":127,"rkB":43,"pw":7.1,"pwF":7.5,"pwB":7.5,"wk":7.3,"src":"FBP","pwP":6.3},{"id":"woody-marks","n":"Woody Marks","p":"RB","t":"HOU","b":8,"a":130.7,"f":7.8,"st":17.0,"tot":133,"rk":35,"fv":107,"rkB":47,"pw":6.5,"pwF":7.8,"pwB":6.3,"wk":6.5,"src":"FBP","pwP":5.5},{"id":"zach-charbonnet","n":"Zach Charbonnet","p":"RB","t":"SEA","b":11,"a":130.7,"f":9.2,"st":11.0,"tot":101,"rk":49,"fv":136,"rkB":42,"pw":7.8,"pwF":5.9,"pwB":8.0,"wk":8.3,"src":"FBP","fl":"g","pwP":9.6},{"id":"tyrone-tracy-jr","n":"Tyrone Tracy Jr.","p":"RB","t":"NYG","b":8,"a":130.7,"f":2.8,"st":16.0,"tot":45,"rk":72,"fv":70,"rkB":64,"pw":2.9,"pwF":2.6,"pwB":4.1,"wk":3.0,"src":"FBP","pwP":2.1},{"id":"wandale-robinson","n":"Wan'Dale Robinson","p":"WR","t":"TEN","b":9,"a":130.8,"f":7.8,"st":17.0,"tot":132,"rk":42,"fv":160,"rkB":43,"pw":8.4,"pwF":7.8,"pwB":9.4,"wk":8.4,"src":"FBP","pwP":8.0},{"id":"khalil-shakir","n":"Khalil Shakir","p":"WR","t":"BUF","b":7,"a":130.8,"f":6.5,"st":15.5,"tot":101,"rk":65,"fv":136,"rkB":53,"pw":6.9,"pwF":5.9,"pwB":8.0,"wk":7.1,"src":"FBP","pwP":6.8},{"id":"denzel-boston","n":"Denzel Boston","p":"WR","t":"CLE","b":11,"a":131.3,"f":6.7,"st":17.0,"tot":114,"rk":56,"fv":136,"rkB":54,"pw":7.4,"pwF":6.7,"pwB":8.0,"wk":7.4,"src":"FBP","fl":"P","pwP":7.4},{"id":"greg-dulcich","n":"Greg Dulcich","p":"TE","t":"MIA","b":6,"a":131.4,"f":7.3,"st":16.5,"tot":120,"rk":23,"fv":94,"rkB":29,"pw":6.4,"pwF":7.1,"pwB":5.5,"wk":6.5,"src":"FBP","pwP":6.6},{"id":"keaton-mitchell","n":"Keaton Mitchell","p":"RB","t":"LAC","b":7,"a":131.5,"f":8.3,"st":1.0,"tot":78,"rk":60,"fv":117,"rkB":46,"pw":5.7,"pwF":4.6,"pwB":6.9,"wk":4.4,"src":"FBP","pwP":5.7},{"id":"vikings-def","n":"Vikings","p":"DEF","t":"MIN","b":6,"a":131.7,"f":6.6,"st":17.0,"tot":113,"rk":6,"fv":154,"rkB":6,"pw":7.2,"pwF":6.6,"pwB":9.1,"wk":7.2,"src":"FBP","pwP":6.0},{"id":"romeo-doubs","n":"Romeo Doubs","p":"WR","t":"NE","b":11,"a":132.0,"f":6.5,"st":17.0,"tot":110,"rk":59,"fv":149,"rkB":48,"pw":7.6,"pwF":6.5,"pwB":8.8,"wk":7.6,"src":"FBP","pwP":7.6},{"id":"chiefs-def","n":"Chiefs","p":"DEF","t":"KC","b":5,"a":132.1,"f":5.6,"st":17.0,"tot":96,"rk":17,"fv":143,"rkB":13,"pw":6.9,"pwF":5.6,"pwB":8.4,"wk":6.9,"src":"FBP","pwP":6.6},{"id":"browns-def","n":"Browns","p":"DEF","t":"CLE","b":11,"a":132.1,"f":5.5,"st":17.0,"tot":94,"rk":25,"fv":129,"rkB":20,"pw":6.5,"pwF":5.5,"pwB":7.6,"wk":6.5,"src":"FBP","pwP":6.5},{"id":"harrison-mevis","n":"Harrison Mevis","p":"K","t":"LAR","b":11,"a":132.2,"f":7.8,"st":17.0,"tot":133,"rk":7,"fv":137,"rkB":15,"pw":8.3,"pwF":7.8,"pwB":8.1,"wk":8.3,"src":"FBP","pwP":9.1},{"id":"tyjae-spears","n":"Tyjae Spears","p":"RB","t":"TEN","b":9,"a":132.5,"f":5.4,"st":16.1,"tot":88,"rk":55,"fv":121,"rkB":44,"pw":5.9,"pwF":5.2,"pwB":7.1,"wk":5.9,"src":"FBP","pwP":5.3},{"id":"spencer-shrader","n":"Spencer Shrader","p":"K","t":"IND","b":13,"a":132.8,"f":7.5,"st":16.5,"tot":125,"rk":17,"pw":8.0,"pwF":7.4,"wk":8.1,"src":"FP","pwP":8.6},{"id":"jayden-higgins","n":"Jayden Higgins","p":"WR","t":"HOU","b":8,"a":132.9,"src":"none"},{"id":"tyler-bass","n":"Tyler Bass","p":"K","t":"BUF","b":7,"a":133.1,"f":7.1,"st":16.0,"tot":114,"rk":22,"pw":7.8,"pwF":6.7,"wk":8.1,"src":"FP","pwP":9.0},{"id":"jalen-coker","n":"Jalen Coker","p":"WR","t":"CAR","b":5,"a":133.4,"f":8.4,"st":17.0,"tot":142,"rk":37,"fv":136,"rkB":55,"pw":8.1,"pwF":8.4,"pwB":8.0,"wk":8.1,"src":"FBP","pwP":7.8},{"id":"chris-boswell","n":"Chris Boswell","p":"K","t":"PIT","b":9,"a":133.4,"f":7.4,"st":17.0,"tot":126,"rk":16,"fv":138,"rkB":12,"pw":8.1,"pwF":7.4,"pwB":8.1,"wk":8.1,"src":"FBP","pwP":8.9},{"id":"cowboys-def","n":"Cowboys","p":"DEF","t":"DAL","b":14,"a":133.5,"f":5.6,"st":17.0,"tot":95,"rk":24,"pw":6.0,"pwF":5.6,"wk":6.0,"src":"FP","pwP":6.4},{"id":"packers-def","n":"Packers","p":"DEF","t":"GB","b":11,"a":136.3,"f":5.7,"st":17.0,"tot":97,"rk":16,"fv":144,"rkB":12,"pw":6.9,"pwF":5.7,"pwB":8.5,"wk":6.9,"src":"FBP","pwP":6.4},{"id":"wil-lutz","n":"Wil Lutz","p":"K","t":"DEN","b":10,"a":136.4,"f":7.5,"st":17.0,"tot":128,"rk":13,"fv":138,"rkB":11,"pw":8.0,"pwF":7.5,"pwB":8.1,"wk":8.0,"src":"FBP","pwP":8.5},{"id":"lions-def","n":"Lions","p":"DEF","t":"DET","b":6,"a":136.6,"f":6.0,"st":17.0,"tot":102,"rk":12,"fv":138,"rkB":15,"pw":6.9,"pwF":6.0,"pwB":8.1,"wk":6.9,"src":"FBP","pwP":6.7},{"id":"steelers-def","n":"Steelers","p":"DEF","t":"PIT","b":9,"a":136.9,"f":6.7,"st":17.0,"tot":114,"rk":5,"fv":159,"rkB":4,"pw":7.6,"pwF":6.7,"pwB":9.4,"wk":7.6,"src":"FBP","pwP":6.7},{"id":"jaguars-def","n":"Jaguars","p":"DEF","t":"JAX","b":7,"a":137.8,"f":6.3,"st":17.0,"tot":107,"rk":13,"fv":144,"rkB":11,"pw":7.1,"pwF":6.3,"pwB":8.5,"wk":7.1,"src":"FBP","pwP":6.5},{"id":"jake-bates","n":"Jake Bates","p":"K","t":"DET","b":6,"a":137.9,"f":7.5,"st":17.0,"tot":127,"rk":14,"fv":142,"rkB":8,"pw":8.3,"pwF":7.5,"pwB":8.4,"wk":8.3,"src":"FBP","pwP":9.1},{"id":"ravens-def","n":"Ravens","p":"DEF","t":"BAL","b":13,"a":138.4,"f":6.1,"st":17.0,"tot":104,"rk":11,"fv":142,"rkB":14,"pw":7.0,"pwF":6.1,"pwB":8.4,"wk":7.0,"src":"FBP","pwP":6.6},{"id":"tyler-loop","n":"Tyler Loop","p":"K","t":"BAL","b":13,"a":139.3,"f":7.6,"st":16.0,"tot":122,"rk":19,"fv":146,"rkB":5,"pw":8.2,"pwF":7.2,"pwB":8.6,"wk":8.4,"src":"FBP","pwP":8.9},{"id":"chase-mclaughlin","n":"Chase McLaughlin","p":"K","t":"TB","b":10,"a":139.3,"f":7.6,"st":17.0,"tot":129,"rk":12,"fv":142,"rkB":7,"pw":8.2,"pwF":7.6,"pwB":8.4,"wk":8.2,"src":"FBP","pwP":8.7},{"id":"chargers-def","n":"Chargers","p":"DEF","t":"LAC","b":7,"a":139.4,"f":6.1,"st":17.0,"tot":103,"rk":10,"fv":151,"rkB":8,"pw":7.1,"pwF":6.1,"pwB":8.9,"wk":7.1,"src":"FBP","pwP":6.2},{"id":"evan-mcpherson","n":"Evan McPherson","p":"K","t":"CIN","b":6,"a":142.1,"f":7.0,"st":17.0,"tot":118,"rk":20,"fv":136,"rkB":16,"pw":8.0,"pwF":6.9,"pwB":8.0,"wk":8.0,"src":"FBP","pwP":9.1},{"id":"will-reichard","n":"Will Reichard","p":"K","t":"MIN","b":6,"a":142.5,"f":7.9,"st":17.0,"tot":134,"rk":6,"fv":138,"rkB":10,"pw":8.2,"pwF":7.9,"pwB":8.1,"wk":8.2,"src":"FBP","pwP":8.6},{"id":"eddy-pineiro","n":"Eddy Pineiro","p":"K","t":"SF","b":8,"a":142.6,"f":7.7,"st":17.0,"tot":130,"rk":10,"fv":143,"rkB":6,"pw":8.4,"pwF":7.6,"pwB":8.4,"wk":8.4,"src":"FBP","pwP":9.2},{"id":"andy-borregales","n":"Andy Borregales","p":"K","t":"NE","b":11,"a":143.1,"f":7.7,"st":17.0,"tot":131,"rk":9,"fv":135,"rkB":18,"pw":8.1,"pwF":7.7,"pwB":7.9,"wk":8.1,"src":"FBP","pwP":8.6},{"id":"cairo-santos","n":"Cairo Santos","p":"K","t":"CHI","b":10,"a":144.1,"f":7.8,"st":17.0,"tot":133,"rk":8,"fv":137,"rkB":14,"pw":8.2,"pwF":7.8,"pwB":8.1,"wk":8.2,"src":"FBP","pwP":8.7},{"id":"jalen-mcmillan","n":"Jalen McMillan","p":"WR","t":"TB","b":10,"a":161.1,"f":5.9,"st":15.0,"tot":89,"rk":72,"fv":115,"rkB":68,"pw":6.0,"pwF":5.2,"pwB":6.8,"wk":6.3,"src":"FBP","pwP":6.1},{"id":"adonai-mitchell","n":"Adonai Mitchell","p":"WR","t":"NYJ","b":13,"a":161.8,"f":4.7,"st":17.0,"tot":80,"rk":76,"fv":102,"rkB":76,"pw":5.5,"pwF":4.7,"pwB":6.0,"wk":5.5,"src":"FBP","pwP":5.9},{"id":"dylan-sampson","n":"Dylan Sampson","p":"RB","t":"CLE","b":11,"a":163.6,"f":4.6,"st":16.5,"tot":76,"rk":59,"fv":93,"rkB":55,"pw":5.0,"pwF":4.5,"pwB":5.5,"wk":5.0,"src":"FBP","pwP":5.0},{"id":"ryan-flournoy","n":"Ryan Flournoy","p":"WR","t":"DAL","b":14,"a":170.7,"f":4.9,"st":17.0,"tot":83,"rk":73,"fv":112,"rkB":70,"pw":5.7,"pwF":4.9,"pwB":6.6,"wk":5.7,"src":"FBP","pwP":5.6},{"id":"pat-bryant","n":"Pat Bryant","p":"WR","t":"DEN","b":10,"a":170.8,"f":6.5,"st":16.0,"tot":104,"rk":62,"fv":103,"rkB":75,"pw":5.3,"pwF":6.1,"pwB":6.1,"wk":5.4,"src":"FBP","pwP":3.7},{"id":"malik-davis","n":"Malik Davis","p":"RB","t":"DAL","b":14,"a":175.8,"f":11.3,"st":1.0,"tot":94,"rk":53,"fv":94,"rkB":54,"pw":4.8,"pwF":5.5,"pwB":5.5,"wk":3.2,"src":"FBP","pwP":3.3},{"id":"dontayvion-wicks","n":"Dontayvion Wicks","p":"WR","t":"PHI","b":10,"a":177.0,"f":6.8,"st":17.0,"tot":115,"rk":53,"fv":104,"rkB":74,"pw":5.6,"pwF":6.8,"pwB":6.1,"wk":5.6,"src":"FBP","pwP":4.0},{"id":"cyrus-allen","n":"Cyrus Allen","p":"WR","t":"KC","b":5,"a":178.0,"fv":66,"rkB":100,"pw":4.0,"pwB":3.9,"wk":4.0,"src":"BP","pwP":4.2},{"id":"tre-harris","n":"Tre' Harris","p":"WR","t":"LAC","b":7,"a":183.3,"f":3.2,"st":17.0,"tot":55,"rk":94,"fv":121,"rkB":63,"pw":5.2,"pwF":3.2,"pwB":7.1,"wk":5.2,"src":"FBP","pwP":5.2},{"id":"jerry-jeudy","n":"Jerry Jeudy","p":"WR","t":"CLE","b":11,"a":189.0,"f":8.4,"st":16.5,"tot":138,"rk":40,"fv":116,"rkB":67,"pw":6.8,"pwF":8.1,"pwB":6.8,"wk":6.9,"src":"FBP","pwP":5.4},{"id":"omar-cooper-jr","n":"Omar Cooper Jr.","p":"WR","t":"NYJ","b":13,"a":193.9,"f":2.0,"st":17.0,"tot":34,"rk":115,"fv":80,"rkB":89,"pw":3.4,"pwF":2.0,"pwB":4.7,"wk":3.4,"src":"FBP","fl":"P","pwP":3.6},{"id":"jaylin-noel","n":"Jaylin Noel","p":"WR","t":"HOU","b":8,"a":198.5,"f":4.5,"st":15.0,"tot":68,"rk":83,"fv":59,"rkB":107,"pw":4.1,"pwF":4.0,"pwB":3.5,"wk":4.2,"src":"FBP","pwP":4.7},{"id":"caleb-douglas","n":"Caleb Douglas","p":"WR","t":"MIA","b":6,"a":199.1,"f":7.5,"st":17.0,"tot":128,"rk":44,"fv":126,"rkB":62,"pw":7.0,"pwF":7.5,"pwB":7.4,"wk":7.0,"src":"FBP","fl":"P","pwP":6.2},{"id":"najee-harris","n":"Najee Harris","p":"RB","t":"NYG","b":8,"a":200.8,"f":4.1,"st":15.0,"tot":61,"rk":64,"fv":85,"rkB":58,"pw":4.7,"pwF":3.6,"pwB":5.0,"wk":4.9,"src":"FBP","pwP":5.6},{"id":"malachi-fields","n":"Malachi Fields","p":"WR","t":"NYG","b":8,"a":205.3,"f":4.9,"st":17.0,"tot":83,"rk":74,"fv":100,"rkB":77,"pw":5.1,"pwF":4.9,"pwB":5.9,"wk":5.1,"src":"FBP","pwP":4.6},{"id":"gunnar-helm","n":"Gunnar Helm","p":"TE","t":"TEN","b":9,"a":209.1,"f":6.9,"st":17.0,"tot":118,"rk":21,"fv":98,"rkB":28,"pw":6.1,"pwF":6.9,"pwB":5.8,"wk":6.1,"src":"FBP","pwP":5.5},{"id":"malik-washington","n":"Malik Washington","p":"WR","t":"MIA","b":6,"a":210.4,"f":6.1,"st":17.0,"tot":103,"rk":61,"fv":130,"rkB":57,"pw":7.1,"pwF":6.1,"pwB":7.6,"wk":7.1,"src":"FBP","pwP":7.5},{"id":"zachariah-branch","n":"Zachariah Branch","p":"WR","t":"ATL","b":11,"a":213.5,"f":2.5,"st":17.0,"tot":43,"rk":107,"fv":72,"rkB":95,"pw":3.8,"pwF":2.5,"pwB":4.2,"wk":3.8,"src":"FBP","fl":"P","pwP":4.6},{"id":"cade-otton","n":"Cade Otton","p":"TE","t":"TB","b":10,"a":214.7,"f":6.3,"st":17.0,"tot":107,"rk":26,"fv":113,"rkB":25,"pw":6.1,"pwF":6.3,"pwB":6.6,"wk":6.1,"src":"FBP","pwP":5.4},{"id":"jacoby-brissett","n":"Jacoby Brissett","p":"QB","t":"ARI","b":14,"a":214.9,"f":14.3,"st":15.0,"tot":215,"rk":28,"fv":262,"rkB":28,"pw":14.1,"pwF":12.6,"pwB":15.4,"wk":14.7,"src":"FBP","pwP":14.3},{"id":"ted-hurst-iii","n":"Ted Hurst III","p":"WR","t":"TB","b":10,"a":215.9,"f":3.1,"st":17.0,"tot":52,"rk":96,"fv":70,"rkB":98,"pw":3.5,"pwF":3.1,"pwB":4.1,"wk":3.5,"src":"FBP","fl":"PQ","pwP":3.3},{"id":"george-holani","n":"George Holani","p":"RB","t":"SEA","b":11,"a":216.1,"f":5.4,"st":17.0,"tot":92,"rk":51,"fv":75,"rkB":63,"pw":4.3,"pwF":5.4,"pwB":4.4,"wk":4.3,"src":"FBP","pwP":3.2},{"id":"kaytron-allen","n":"Kaytron Allen","p":"RB","t":"WAS","b":7,"a":217.7,"f":9.9,"st":1.0,"tot":59,"rk":65,"fv":60,"rkB":71,"pw":3.3,"pwF":3.5,"pwB":3.5,"wk":2.4,"src":"FBP","pwP":2.9},{"id":"geno-smith","n":"Geno Smith","p":"QB","t":"NYJ","b":13,"a":219.2,"f":13.0,"st":15.0,"tot":195,"rk":29,"fv":246,"rkB":29,"pw":13.0,"pwF":11.5,"pwB":14.5,"wk":13.5,"src":"FBP","pwP":12.9},{"id":"devaughn-vele","n":"Devaughn Vele","p":"WR","t":"NO","b":8,"a":220.6,"f":6.4,"st":17.0,"tot":108,"rk":58,"fv":90,"rkB":82,"pw":5.8,"pwF":6.4,"pwB":5.3,"wk":5.8,"src":"FBP","pwP":5.8},{"id":"nicholas-singleton","n":"Nicholas Singleton","p":"RB","t":"TEN","b":9,"a":220.9,"f":6.7,"st":1.0,"tot":37,"rk":83,"fv":54,"rkB":74,"pw":2.5,"pwF":2.2,"pwB":3.2,"wk":1.9,"src":"FBP","fl":"PQ","pwP":2.1},{"id":"sean-tucker","n":"Sean Tucker","p":"RB","t":"TB","b":10,"a":222.4,"f":1.7,"st":17.0,"tot":28,"rk":94,"fv":45,"rkB":82,"pw":2.2,"pwF":1.6,"pwB":2.6,"wk":2.2,"src":"FBP","fl":"Q","pwP":2.4},{"id":"chris-bell","n":"Chris Bell","p":"WR","t":"MIA","b":6,"a":223.6,"f":4.3,"st":14.0,"tot":60,"rk":90,"fv":84,"rkB":86,"pw":4.3,"pwF":3.5,"pwB":4.9,"wk":4.6,"src":"FBP","pwP":4.6},{"id":"darren-waller","n":"Darren Waller","p":"TE","t":"CAR","b":5,"a":223.9,"f":3.3,"st":15.0,"tot":49,"rk":41,"fv":81,"rkB":31,"pw":4.0,"pwF":2.9,"pwB":4.8,"wk":4.2,"src":"FBP","pwP":4.4},{"id":"antonio-williams","n":"Antonio Williams","p":"WR","t":"WAS","b":7,"a":224.3,"f":3.9,"st":17.0,"tot":66,"rk":86,"pw":2.6,"pwF":3.9,"wk":2.6,"src":"FP","pwP":1.4},{"id":"calvin-ridley","n":"Calvin Ridley","p":"WR","t":"TEN","b":9,"a":225.5,"f":5.9,"st":16.0,"tot":94,"rk":68,"fv":106,"rkB":72,"pw":5.8,"pwF":5.5,"pwB":6.2,"wk":6.0,"src":"FBP","pwP":5.8},{"id":"kimani-vidal","n":"Kimani Vidal","p":"RB","t":"LAC","b":7,"a":226.9,"f":7.1,"st":1.0,"tot":54,"rk":68,"fv":56,"rkB":72,"pw":3.0,"pwF":3.2,"pwB":3.3,"wk":2.1,"src":"FBP","pwP":2.4},{"id":"demond-claiborne","n":"Demond Claiborne","p":"RB","t":"MIN","b":6,"a":228.5,"f":2.5,"st":17.0,"tot":43,"rk":73,"fv":39,"rkB":89,"pw":2.1,"pwF":2.5,"pwB":2.3,"wk":2.1,"src":"FBP","fl":"PQ","pwP":1.6},{"id":"samaje-perine","n":"Samaje Perine","p":"RB","t":"CIN","b":6,"a":228.7,"f":5.4,"st":16.0,"tot":86,"rk":54,"fv":91,"rkB":56,"pw":4.8,"pwF":5.1,"pwB":5.4,"wk":4.9,"src":"FBP","pwP":3.8},{"id":"seth-mcgowan","n":"Seth McGowan","p":"RB","t":"IND","b":13,"a":230.6,"f":13.8,"st":1.5,"tot":77,"rk":61,"fv":52,"rkB":80,"pw":3.2,"pwF":4.5,"pwB":3.1,"wk":2.2,"src":"FBP","fl":"P","pwP":2.0},{"id":"rashod-bateman","n":"Rashod Bateman","p":"WR","t":"BAL","b":13,"a":231.0,"f":4.0,"st":15.0,"tot":61,"rk":92,"fv":113,"rkB":69,"pw":4.9,"pwF":3.6,"pwB":6.6,"wk":5.0,"src":"FBP","pwP":4.4},{"id":"mike-gesicki","n":"Mike Gesicki","p":"TE","t":"CIN","b":6,"a":231.0,"f":5.9,"st":17.0,"tot":101,"rk":29,"fv":86,"rkB":30,"pw":5.5,"pwF":5.9,"pwB":5.1,"wk":5.5,"src":"FBP","pwP":5.4},{"id":"roschon-johnson","n":"Roschon Johnson","p":"RB","t":"CHI","b":10,"a":233.0,"fv":25,"rkB":101,"pw":1.4,"pwB":1.5,"wk":1.4,"src":"BP","pwP":1.3},{"id":"kaleb-johnson","n":"Kaleb Johnson","p":"RB","t":"GB","b":11,"a":234.2,"f":1.8,"st":17.0,"tot":30,"rk":92,"fv":65,"rkB":69,"pw":3.4,"pwF":1.8,"pwB":3.8,"wk":3.4,"src":"FBP","fl":"Q","pwP":4.5},{"id":"mason-taylor","n":"Mason Taylor","p":"TE","t":"NYJ","b":13,"a":235.4,"f":5.7,"st":17.0,"tot":97,"rk":28,"fv":69,"rkB":35,"pw":4.3,"pwF":5.7,"pwB":4.1,"wk":4.3,"src":"FBP","fl":"Q","pwP":3.0},{"id":"charlie-smyth","n":"Charlie Smyth","p":"K","t":"NO","b":8,"a":236.0,"src":"none"},{"id":"treylon-burks","n":"Treylon Burks","p":"WR","t":"WAS","b":7,"a":237.0,"fv":54,"rkB":111,"pw":3.8,"pwB":3.2,"wk":3.8,"src":"BP","pwP":4.4},{"id":"chris-brooks","n":"Chris Brooks","p":"RB","t":"GB","b":11,"a":237.9,"f":7.6,"st":1.0,"tot":102,"rk":47,"fv":84,"rkB":59,"pw":4.4,"pwF":6.0,"pwB":4.9,"wk":2.6,"src":"FBP","fl":"Q","pwP":2.3},{"id":"tank-dell","n":"Tank Dell","p":"WR","t":"HOU","b":8,"a":238.4,"fv":84,"rkB":85,"pw":3.8,"pwB":4.9,"wk":3.8,"src":"BP","pwP":2.7},{"id":"germie-bernard","n":"Germie Bernard","p":"WR","t":"PIT","b":9,"a":240.0,"f":2.6,"st":17.0,"tot":45,"rk":105,"fv":75,"rkB":92,"pw":3.8,"pwF":2.6,"pwB":4.4,"wk":3.8,"src":"FBP","pwP":4.3},{"id":"kendre-miller","n":"Kendre Miller","p":"RB","t":"NO","b":8,"a":241.0,"f":1.7,"st":14.0,"tot":24,"rk":93,"fv":52,"rkB":79,"pw":2.3,"pwF":1.4,"pwB":3.1,"wk":2.4,"src":"FBP","pwP":2.3},{"id":"bryce-lance","n":"Bryce Lance","p":"WR","t":"NO","b":8,"a":241.0,"src":"P","pwP":3.1,"pw":3.1,"wk":3.1},{"id":"colts-def","n":"Colts","p":"DEF","t":"IND","b":13,"a":242.0,"f":5.8,"st":17.0,"tot":99,"rk":19,"pw":6.2,"pwF":5.8,"wk":6.2,"src":"FP","pwP":6.5},{"id":"tyquan-thornton","n":"Tyquan Thornton","p":"WR","t":"KC","b":5,"a":242.6,"f":4.2,"st":17.0,"tot":72,"rk":84,"fv":108,"rkB":71,"pw":4.9,"pwF":4.2,"pwB":6.4,"wk":4.9,"src":"FBP","pwP":4.1},{"id":"jaylen-wright","n":"Jaylen Wright","p":"RB","t":"MIA","b":6,"a":242.8,"f":7.0,"st":1.0,"tot":45,"rk":70,"fv":60,"rkB":70,"pw":3.0,"pwF":2.6,"pwB":3.5,"wk":2.3,"src":"FBP","pwP":3.0},{"id":"eli-stowers","n":"Eli Stowers","p":"TE","t":"PHI","b":10,"a":242.8,"src":"P","pwP":2.0,"pw":2.0,"wk":2.0},{"id":"justice-hill","n":"Justice Hill","p":"RB","t":"BAL","b":13,"a":243.3,"f":5.0,"st":16.0,"tot":79,"rk":57,"fv":103,"rkB":50,"pw":5.1,"pwF":4.6,"pwB":6.1,"wk":5.2,"src":"FBP","pwP":4.6},{"id":"joshua-palmer","n":"Joshua Palmer","p":"WR","t":"BUF","b":7,"a":245.0,"fv":65,"rkB":101,"pw":3.8,"pwB":3.8,"wk":3.8,"src":"BP","pwP":3.8},{"id":"darnell-washington","n":"Darnell Washington","p":"TE","t":"PIT","b":9,"a":245.8,"f":3.5,"st":17.0,"tot":59,"rk":38,"fv":64,"rkB":38,"pw":3.5,"pwF":3.5,"pwB":3.8,"wk":3.5,"src":"FBP","pwP":3.3},{"id":"jack-bech","n":"Jack Bech","p":"WR","t":"LV","b":13,"a":247.1,"f":5.6,"st":17.0,"tot":95,"rk":66,"fv":62,"rkB":104,"pw":4.6,"pwF":5.6,"pwB":3.6,"wk":4.6,"src":"FBP","pwP":4.6},{"id":"jake-tonges","n":"Jake Tonges","p":"TE","t":"SF","b":8,"a":248.8,"f":8.4,"st":1.0,"tot":44,"rk":44,"pw":2.7,"pwF":2.6,"wk":1.7,"src":"FP","pwP":2.7},{"id":"tory-horton","n":"Tory Horton","p":"WR","t":"SEA","b":11,"a":252.8,"fv":52,"rkB":112,"pw":2.9,"pwB":3.1,"wk":2.9,"src":"BP","pwP":2.6},{"id":"buccaneers-def","n":"Buccaneers","p":"DEF","t":"TB","b":10,"a":254.0,"f":5.9,"st":17.0,"tot":100,"rk":15,"fv":137,"rkB":16,"pw":6.7,"pwF":5.9,"pwB":8.1,"wk":6.7,"src":"FBP","pwP":6.2},{"id":"theo-johnson","n":"Theo Johnson","p":"TE","t":"NYG","b":8,"a":254.5,"f":2.0,"st":17.0,"tot":34,"rk":52,"fv":64,"rkB":39,"pw":3.0,"pwF":2.0,"pwB":3.8,"wk":3.0,"src":"FBP","pwP":3.3},{"id":"jordan-james","n":"Jordan James","p":"RB","t":"SF","b":8,"a":254.6,"f":6.6,"st":2.0,"tot":38,"rk":82,"fv":53,"rkB":76,"pw":2.5,"pwF":2.2,"pwB":3.1,"wk":2.0,"src":"FBP","pwP":2.1},{"id":"ollie-gordon-ii","n":"Ollie Gordon II","p":"RB","t":"MIA","b":6,"a":254.6,"f":9.3,"st":1.0,"tot":55,"rk":66,"fv":39,"rkB":90,"pw":2.5,"pwF":3.2,"pwB":2.3,"wk":1.6,"src":"FBP","pwP":1.9},{"id":"jahan-dotson","n":"Jahan Dotson","p":"WR","t":"ATL","b":11,"a":254.7,"f":5.3,"st":17.0,"tot":90,"rk":70,"fv":83,"rkB":87,"pw":4.9,"pwF":5.3,"pwB":4.9,"wk":4.9,"src":"FBP","pwP":4.6},{"id":"elijah-sarratt","n":"Elijah Sarratt","p":"WR","t":"BAL","b":13,"a":255.0,"f":3.8,"st":17.0,"tot":64,"rk":87,"pw":3.8,"pwF":3.8,"wk":3.8,"src":"F"},{"id":"emanuel-wilson","n":"Emanuel Wilson","p":"RB","t":"SEA","b":11,"a":255.4,"f":2.8,"st":16.0,"tot":45,"rk":74,"fv":26,"rkB":98,"pw":2.1,"pwF":2.6,"pwB":1.5,"wk":2.2,"src":"FBP","pwP":2.3},{"id":"titans-def","n":"Titans","p":"DEF","t":"TEN","b":9,"a":256.0,"f":5.8,"st":17.0,"tot":99,"rk":23,"pw":6.0,"pwF":5.8,"wk":6.0,"src":"FP","pwP":6.2},{"id":"erick-all-jr","n":"Erick All Jr.","p":"TE","t":"CIN","b":6,"a":256.0,"src":"P","pwP":3.1,"pw":3.1,"wk":3.1},{"id":"colby-parkinson","n":"Colby Parkinson","p":"TE","t":"LAR","b":11,"a":256.3,"f":4.2,"st":17.0,"tot":71,"rk":33,"fv":79,"rkB":33,"pw":4.1,"pwF":4.2,"pwB":4.6,"wk":4.1,"src":"FBP","pwP":3.6},{"id":"tua-tagovailoa","n":"Tua Tagovailoa","p":"QB","t":"ATL","b":11,"a":256.5,"f":13.4,"st":5.0,"tot":68,"rk":35,"fv":209,"rkB":33,"pw":8.5,"pwF":4.0,"pwB":12.3,"wk":8.8,"src":"FBP","pwP":9.2},{"id":"michael-penix-jr","n":"Michael Penix Jr.","p":"QB","t":"ATL","b":11,"a":256.6,"f":12.4,"st":11.0,"tot":137,"rk":32,"fv":226,"rkB":30,"pw":9.6,"pwF":8.1,"pwB":13.3,"wk":10.2,"src":"FBP","pwP":7.5},{"id":"isaiah-davis","n":"Isaiah Davis","p":"RB","t":"NYJ","b":13,"a":256.9,"f":2.4,"st":15.0,"tot":36,"rk":80,"fv":53,"rkB":77,"pw":2.6,"pwF":2.1,"pwB":3.1,"wk":2.7,"src":"FBP","pwP":2.7},{"id":"darnell-mooney","n":"Darnell Mooney","p":"WR","t":"NYG","b":8,"a":257.0,"f":1.8,"st":17.0,"tot":31,"rk":117,"fv":46,"rkB":118,"pw":2.9,"pwF":1.8,"pwB":2.7,"wk":2.9,"src":"FBP","pwP":4.2},{"id":"devin-singletary","n":"Devin Singletary","p":"RB","t":"NYG","b":8,"a":257.7,"f":2.0,"st":17.0,"tot":34,"rk":84,"fv":42,"rkB":85,"pw":2.0,"pwF":2.0,"pwB":2.5,"wk":2.0,"src":"FBP","pwP":1.4},{"id":"keon-coleman","n":"Keon Coleman","p":"WR","t":"BUF","b":7,"a":258.3,"f":4.0,"st":17.0,"tot":68,"rk":80,"fv":82,"rkB":88,"pw":3.8,"pwF":4.0,"pwB":4.8,"wk":3.8,"src":"FBP","fl":"Q","pwP":2.5},{"id":"jaydon-blue","n":"Jaydon Blue","p":"RB","t":"PHI","b":10,"a":258.5,"fv":31,"rkB":93,"pw":1.8,"pwB":1.8,"wk":1.8,"src":"B"},{"id":"lequint-allen-jr","n":"LeQuint Allen Jr.","p":"RB","t":"JAX","b":7,"a":260.1,"f":2.3,"st":14.0,"tot":32,"rk":79,"fv":66,"rkB":67,"pw":2.4,"pwF":1.9,"pwB":3.9,"wk":2.5,"src":"FBP","fl":"g","pwP":1.3},{"id":"michael-mayer","n":"Michael Mayer","p":"TE","t":"LV","b":13,"a":260.2,"f":3.8,"st":17.0,"tot":65,"rk":34,"pw":4.2,"pwF":3.8,"wk":4.2,"src":"FP","pwP":4.5},{"id":"marlin-klein","n":"Marlin Klein","p":"TE","t":"HOU","b":8,"a":261.0,"src":"P","pwP":1.7,"pw":1.7,"wk":1.7},{"id":"chimere-dike","n":"Chimere Dike","p":"WR","t":"TEN","b":9,"a":261.0,"f":3.6,"st":17.0,"tot":61,"rk":89,"pw":3.4,"pwF":3.6,"wk":3.4,"src":"FP","pwP":3.1},{"id":"bengals-def","n":"Bengals","p":"DEF","t":"CIN","b":6,"a":261.5,"f":5.9,"st":17.0,"tot":100,"rk":26,"pw":6.3,"pwF":5.9,"wk":6.3,"src":"FP","pwP":6.8},{"id":"brenen-thompson","n":"Brenen Thompson","p":"WR","t":"LAC","b":7,"a":263.0,"f":2.4,"st":17.0,"tot":40,"rk":111,"fv":52,"rkB":114,"pw":2.4,"pwF":2.4,"pwB":3.1,"wk":2.4,"src":"FBP","fl":"P","pwP":1.8},{"id":"carson-beck","n":"Carson Beck","p":"QB","t":"ARI","b":14,"a":264.7,"f":12.3,"st":2.0,"tot":25,"rk":39,"pw":1.6,"pwF":1.5,"wk":1.8,"src":"FP","pwP":1.8},{"id":"darius-slayton","n":"Darius Slayton","p":"WR","t":"NYG","b":8,"a":265.3,"f":4.0,"st":17.0,"tot":67,"rk":85,"fv":69,"rkB":99,"pw":3.9,"pwF":3.9,"pwB":4.1,"wk":3.9,"src":"FBP","pwP":3.7},{"id":"adam-randall","n":"Adam Randall","p":"RB","t":"BAL","b":13,"a":265.5,"f":3.2,"st":13.0,"tot":42,"rk":76,"fv":40,"rkB":86,"pw":2.5,"pwF":2.5,"pwB":2.4,"wk":2.7,"src":"FB"},{"id":"phil-mafah","n":"Phil Mafah","p":"RB","t":"DAL","b":14,"a":265.5,"src":"none"},{"id":"tahj-brooks","n":"Tahj Brooks","p":"RB","t":"CIN","b":6,"a":265.7,"f":1.8,"st":17.0,"tot":31,"rk":90,"fv":29,"rkB":95,"pw":1.8,"pwF":1.8,"pwB":1.7,"wk":1.8,"src":"FBP","fl":"Q","pwP":1.8},{"id":"eli-raridon","n":"Eli Raridon","p":"TE","t":"NE","b":11,"a":266.0,"src":"P","pwP":1.7,"pw":1.7,"wk":1.7},{"id":"deshaun-watson","n":"Deshaun Watson","p":"QB","t":"CLE","b":11,"a":268.0,"f":13.4,"st":12.0,"tot":161,"rk":31,"fv":223,"rkB":31,"pw":11.5,"pwF":9.5,"pwB":13.1,"wk":12.2,"src":"FBP","pwP":12.0},{"id":"kirk-cousins","n":"Kirk Cousins","p":"QB","t":"LV","b":13,"a":268.4,"f":12.9,"st":9.0,"tot":220,"rk":26,"fv":208,"rkB":34,"pw":10.6,"pwF":12.9,"pwB":12.2,"wk":9.1,"src":"FBP","pwP":6.8},{"id":"ashton-dulin","n":"Ashton Dulin","p":"WR","t":"IND","b":13,"a":268.5,"src":"P","pwP":2.4,"pw":2.4,"wk":2.4},{"id":"evan-engram","n":"Evan Engram","p":"TE","t":"DEN","b":10,"a":269.0,"f":6.2,"st":16.0,"tot":99,"rk":27,"fv":101,"rkB":27,"pw":5.5,"pwF":5.8,"pwB":5.9,"wk":5.6,"src":"FBP","fl":"Q","pwP":4.7},{"id":"charlie-kolar","n":"Charlie Kolar","p":"TE","t":"LAC","b":7,"a":269.1,"f":5.6,"st":17.0,"tot":94,"rk":30,"pw":5.0,"pwF":5.5,"wk":5.1,"src":"FP","pwP":4.6},{"id":"xavier-hutchinson","n":"Xavier Hutchinson","p":"WR","t":"HOU","b":8,"a":270.0,"f":3.5,"st":17.0,"tot":59,"rk":91,"fv":100,"rkB":78,"pw":4.3,"pwF":3.5,"pwB":5.9,"wk":4.3,"src":"FBP","pwP":3.4},{"id":"elic-ayomanor","n":"Elic Ayomanor","p":"WR","t":"TEN","b":9,"a":271.3,"fv":65,"rkB":103,"pw":3.0,"pwB":3.8,"wk":3.0,"src":"BP","pwP":2.2},{"id":"falcons-def","n":"Falcons","p":"DEF","t":"ATL","b":11,"a":271.7,"f":5.3,"st":17.0,"tot":89,"rk":29,"fv":131,"rkB":19,"pw":6.3,"pwF":5.2,"pwB":7.7,"wk":6.3,"src":"FBP","pwP":6.0},{"id":"demario-douglas","n":"DeMario Douglas","p":"WR","t":"NE","b":11,"a":271.8,"f":4.9,"st":17.0,"tot":83,"rk":75,"fv":117,"rkB":66,"pw":5.4,"pwF":4.9,"pwB":6.9,"wk":5.4,"src":"FBP","pwP":4.4},{"id":"hollywood-brown","n":"Hollywood Brown","p":"WR","t":"PHI","b":10,"a":272.3,"f":4.0,"st":17.0,"tot":68,"rk":81,"pw":4.0,"pwF":4.0,"wk":4.0,"src":"F"},{"id":"troy-franklin","n":"Troy Franklin","p":"WR","t":"DEN","b":10,"a":273.2,"f":2.4,"st":17.0,"tot":40,"rk":110,"fv":61,"rkB":105,"pw":3.2,"pwF":2.4,"pwB":3.6,"wk":3.2,"src":"FBP","fl":"Q","pwP":3.5},{"id":"saints-def","n":"Saints","p":"DEF","t":"NO","b":8,"a":274.0,"f":6.1,"st":17.0,"tot":103,"rk":18,"fv":134,"rkB":18,"pw":6.6,"pwF":6.1,"pwB":7.9,"wk":6.6,"src":"FBP","pwP":5.9},{"id":"skyler-bell","n":"Skyler Bell","p":"WR","t":"BUF","b":7,"a":274.8,"f":2.6,"st":17.0,"tot":44,"rk":103,"pw":2.1,"pwF":2.6,"wk":2.1,"src":"FP","pwP":1.7},{"id":"trevor-etienne","n":"Trevor Etienne","p":"RB","t":"CAR","b":5,"a":276.0,"fv":46,"rkB":81,"pw":2.7,"pwB":2.7,"wk":2.7,"src":"B"},{"id":"luke-mccaffrey","n":"Luke McCaffrey","p":"WR","t":"WAS","b":7,"a":277.0,"f":1.9,"st":17.0,"tot":33,"rk":116,"fv":54,"rkB":110,"pw":2.2,"pwF":1.9,"pwB":3.2,"wk":2.2,"src":"FBP","pwP":1.4},{"id":"raheim-sanders","n":"Raheim Sanders","p":"RB","t":"CLE","b":11,"a":277.0,"f":8.4,"st":1.0,"tot":29,"rk":87,"fv":40,"rkB":87,"pw":1.6,"pwF":1.7,"pwB":2.4,"wk":1.2,"src":"FBP","pwP":0.7},{"id":"sione-vaki","n":"Sione Vaki","p":"RB","t":"DET","b":6,"a":278.0,"f":1.7,"st":17.0,"tot":29,"rk":89,"fv":44,"rkB":83,"pw":2.1,"pwF":1.7,"pwB":2.6,"wk":2.1,"src":"FBP","pwP":1.9},{"id":"shedeur-sanders","n":"Shedeur Sanders","p":"QB","t":"CLE","b":11,"a":278.8,"f":13.9,"st":5.0,"tot":58,"rk":34,"fv":158,"rkB":35,"pw":5.5,"pwF":3.4,"pwB":9.3,"wk":6.1,"src":"FBP","pwP":3.9},{"id":"malik-benson","n":"Malik Benson","p":"WR","t":"LV","b":13,"a":279.0,"f":1.8,"st":17.0,"tot":31,"rk":118,"pw":2.0,"pwF":1.8,"wk":2.0,"src":"FP","pwP":2.3},{"id":"christian-kirk","n":"Christian Kirk","p":"WR","t":"SF","b":8,"a":280.0,"src":"none"},{"id":"oscar-delp","n":"Oscar Delp","p":"TE","t":"NO","b":8,"a":280.7,"src":"P","pwP":2.0,"pw":2.0,"wk":2.0},{"id":"dj-giddens","n":"DJ Giddens","p":"RB","t":"IND","b":13,"a":280.8,"f":7.6,"st":0.0,"tot":35,"rk":77,"fv":33,"rkB":92,"pw":2.3,"pwF":2.1,"pwB":1.9,"wk":1.6,"src":"FBP","pwP":2.9},{"id":"xavier-legette","n":"Xavier Legette","p":"WR","t":"CAR","b":5,"a":280.9,"f":4.1,"st":16.0,"tot":66,"rk":82,"fv":78,"rkB":91,"pw":4.5,"pwF":3.9,"pwB":4.6,"wk":4.5,"src":"FBP","pwP":4.9},{"id":"kareem-hunt","n":"Kareem Hunt","p":"RB","t":"KC","b":5,"a":281.0,"src":"none"},{"id":"brandon-aiyuk","n":"Brandon Aiyuk","p":"WR","t":"SF","b":8,"a":282.3,"fv":71,"rkB":97,"pw":4.2,"pwB":4.2,"wk":4.2,"src":"B"},{"id":"emari-demercado","n":"Emari Demercado","p":"RB","t":"DAL","b":14,"a":282.3,"f":2.1,"st":14.0,"tot":29,"rk":85,"fv":13,"rkB":117,"pw":1.2,"pwF":1.7,"pwB":0.8,"wk":1.4,"src":"FBP","pwP":1.2},{"id":"devin-neal","n":"Devin Neal","p":"RB","t":"NO","b":8,"a":282.5,"src":"none"},{"id":"kyle-williams","n":"Kyle Williams","p":"WR","t":"NE","b":11,"a":284.0,"f":4.6,"st":17.0,"tot":78,"rk":78,"pw":3.1,"pwF":4.6,"wk":3.1,"src":"FP","pwP":1.7},{"id":"elijah-arroyo","n":"Elijah Arroyo","p":"TE","t":"SEA","b":11,"a":285.8,"f":3.9,"st":17.0,"tot":66,"rk":35,"fv":67,"rkB":37,"pw":3.8,"pwF":3.9,"pwB":3.9,"wk":3.8,"src":"FBP","pwP":3.5},{"id":"zavion-thomas","n":"Zavion Thomas","p":"WR","t":"CHI","b":10,"a":286.0,"f":1.8,"st":17.0,"tot":31,"rk":119,"pw":1.7,"pwF":1.8,"wk":1.7,"src":"FP","pwP":1.6},{"id":"andrei-iosivas","n":"Andrei Iosivas","p":"WR","t":"CIN","b":6,"a":290.5,"f":2.9,"st":17.0,"tot":50,"rk":99,"fv":90,"rkB":83,"pw":4.1,"pwF":2.9,"pwB":5.3,"wk":4.1,"src":"FBP","pwP":4.2},{"id":"isaiah-bond","n":"Isaiah Bond","p":"WR","t":"CLE","b":11,"a":291.0,"f":2.7,"st":17.0,"tot":47,"rk":104,"pw":2.2,"pwF":2.8,"wk":2.2,"src":"FP","pwP":1.7},{"id":"cj-daniels","n":"CJ Daniels","p":"WR","t":"LAR","b":11,"a":291.0,"src":"none"},{"id":"ty-johnson","n":"Ty Johnson","p":"RB","t":"BUF","b":7,"a":291.7,"f":2.7,"st":15.0,"tot":41,"rk":75,"fv":68,"rkB":66,"pw":3.2,"pwF":2.4,"pwB":4.0,"wk":3.3,"src":"FBP","pwP":3.3},{"id":"marvin-mims-jr","n":"Marvin Mims Jr.","p":"WR","t":"DEN","b":10,"a":291.8,"f":2.9,"st":17.0,"tot":49,"rk":101,"fv":60,"rkB":106,"pw":3.1,"pwF":2.9,"pwB":3.5,"wk":3.1,"src":"FBP","pwP":2.9},{"id":"jarquez-hunter","n":"Jarquez Hunter","p":"RB","t":"MIA","b":6,"a":292.0,"fv":17,"rkB":109,"pw":1.0,"pwB":1.0,"wk":1.0,"src":"B"},{"id":"brashard-smith","n":"Brashard Smith","p":"RB","t":"KC","b":5,"a":292.5,"f":2.5,"st":17.0,"tot":42,"rk":71,"fv":54,"rkB":75,"pw":2.8,"pwF":2.5,"pwB":3.2,"wk":2.8,"src":"FBP","pwP":2.6},{"id":"savion-williams","n":"Savion Williams","p":"WR","t":"GB","b":11,"a":293.0,"src":"P","pwP":2.0,"pw":2.0,"wk":2.0},{"id":"roman-wilson","n":"Roman Wilson","p":"WR","t":"PIT","b":9,"a":295.0,"f":2.9,"st":17.0,"tot":50,"rk":98,"fv":52,"rkB":115,"pw":3.3,"pwF":2.9,"pwB":3.1,"wk":3.3,"src":"FBP","pwP":3.8},{"id":"kendrick-bourne","n":"Kendrick Bourne","p":"WR","t":"ARI","b":14,"a":295.8,"fv":75,"rkB":93,"pw":4.5,"pwB":4.4,"wk":4.5,"src":"BP","pwP":4.6},{"id":"kalif-raymond","n":"Kalif Raymond","p":"WR","t":"CHI","b":10,"a":298.0,"f":2.3,"st":17.0,"tot":39,"rk":113,"fv":78,"rkB":90,"pw":3.1,"pwF":2.3,"pwB":4.6,"wk":3.1,"src":"FBP","pwP":2.5},{"id":"colbie-young","n":"Colbie Young","p":"WR","t":"CIN","b":6,"a":298.7,"f":2.5,"st":17.0,"tot":43,"rk":109,"pw":1.9,"pwF":2.5,"wk":1.9,"src":"FP","pwP":1.4},{"id":"corey-kiner","n":"Corey Kiner","p":"RB","t":"NE","b":11,"a":303.0,"fv":20,"rkB":103,"pw":0.9,"pwB":1.2,"wk":0.9,"src":"BP","pwP":0.6},{"id":"daniel-carlson","n":"Daniel Carlson","p":"K","t":"NO","b":8,"a":300.0,"f":6.7,"st":17.0,"tot":114,"rk":21,"pw":7.5,"pwF":6.7,"wk":7.5,"src":"FP","pwP":8.3},{"id":"joey-slye","n":"Joey Slye","p":"K","t":"TEN","b":9,"a":300.0,"f":6.5,"st":17.0,"tot":110,"rk":24,"pw":7.2,"pwF":6.5,"wk":7.2,"src":"FP","pwP":7.8},{"id":"ryan-fitzgerald","n":"Ryan Fitzgerald","p":"K","t":"CAR","b":5,"a":300.0,"f":6.3,"st":16.3,"tot":103,"rk":25,"pw":7.1,"pwF":6.1,"wk":7.2,"src":"FP","pwP":8.1},{"id":"dominic-zvada","n":"Dominic Zvada","p":"K","t":"NYG","b":8,"a":300.0,"f":6.4,"st":16.0,"tot":102,"rk":26,"pw":7.2,"pwF":6.0,"wk":7.4,"src":"FP","pwP":8.3},{"id":"drew-stevens","n":"Drew Stevens","p":"K","t":"WAS","b":7,"a":300.0,"f":6.3,"st":16.0,"tot":101,"rk":27,"pw":7.2,"pwF":5.9,"wk":7.3,"src":"FP","pwP":8.4},{"id":"andre-szmyt","n":"Andre Szmyt","p":"K","t":"CLE","b":11,"a":300.0,"f":5.9,"st":17.0,"tot":100,"rk":28,"pw":7.0,"pwF":5.9,"wk":7.0,"src":"FP","pwP":8.0},{"id":"matt-gay","n":"Matt Gay","p":"K","t":"LV","b":13,"a":300.0,"f":6.2,"st":16.0,"tot":100,"rk":29,"pw":7.0,"pwF":5.9,"wk":7.1,"src":"FP","pwP":8.0},{"id":"riley-patterson","n":"Riley Patterson","p":"K","t":"MIA","b":6,"a":300.0,"f":5.8,"st":17.0,"tot":99,"rk":30,"pw":6.7,"pwF":5.8,"wk":6.7,"src":"FP","pwP":7.5},{"id":"chad-ryland","n":"Chad Ryland","p":"K","t":"ARI","b":14,"a":300.0,"f":6.0,"st":16.0,"tot":96,"rk":31,"fv":124,"rkB":21,"pw":6.8,"pwF":5.6,"pwB":7.3,"wk":7.0,"src":"FBP","pwP":7.6},{"id":"blake-grupe","n":"Blake Grupe","p":"K","t":"NYJ","b":13,"a":300.0,"f":6.0,"st":16.0,"tot":96,"rk":32,"pw":6.6,"pwF":5.6,"wk":6.8,"src":"FP","pwP":7.6},{"id":"jameis-winston","n":"Jameis Winston","p":"QB","t":"NYG","b":8,"a":300.0,"f":15.2,"st":2.0,"tot":32,"rk":36,"pw":2.1,"pwF":1.9,"wk":2.3,"src":"FP","pwP":2.4},{"id":"justin-fields","n":"Justin Fields","p":"QB","t":"KC","b":5,"a":300.0,"f":21.4,"st":1.0,"tot":32,"rk":37,"pw":2.6,"pwF":1.9,"wk":2.5,"src":"FP","pwP":3.4},{"id":"cade-klubnik","n":"Cade Klubnik","p":"QB","t":"NYJ","b":13,"a":300.0,"f":11.8,"st":2.0,"tot":25,"rk":38,"pw":2.1,"pwF":1.5,"wk":2.2,"src":"FP","pwP":2.8},{"id":"joe-flacco","n":"Joe Flacco","p":"QB","t":"CIN","b":6,"a":300.0,"f":16.2,"st":1.4,"tot":25,"rk":40,"pw":1.9,"pwF":1.5,"wk":2.0,"src":"FP","pwP":2.4},{"id":"joshua-dobbs","n":"Joshua Dobbs","p":"QB","t":"DET","b":6,"a":300.0,"f":19.6,"st":1.0,"tot":22,"rk":41,"pw":1.6,"pwF":1.3,"wk":1.6,"src":"FP","pwP":1.8},{"id":"tyler-huntley","n":"Tyler Huntley","p":"QB","t":"BAL","b":13,"a":300.0,"f":19.3,"st":1.0,"tot":22,"rk":42,"pw":1.5,"pwF":1.3,"wk":1.5,"src":"FP","pwP":1.6},{"id":"quinn-ewers","n":"Quinn Ewers","p":"QB","t":"JAX","b":7,"a":300.0,"f":16.4,"st":1.0,"tot":22,"rk":43,"pw":1.2,"pwF":1.3,"wk":1.1,"src":"FP","pwP":1.1},{"id":"mac-jones","n":"Mac Jones","p":"QB","t":"SF","b":8,"a":300.0,"f":18.4,"st":1.0,"tot":21,"rk":44,"pw":1.7,"pwF":1.2,"wk":1.8,"src":"FP","pwP":2.2},{"id":"jj-mccarthy","n":"J.J. McCarthy","p":"QB","t":"MIN","b":6,"a":300.0,"f":17.4,"st":1.0,"tot":19,"rk":45,"pw":1.4,"pwF":1.1,"wk":1.4,"src":"FP","pwP":1.6},{"id":"sam-howell","n":"Sam Howell","p":"QB","t":"DAL","b":14,"a":300.0,"f":18.2,"st":1.0,"tot":18,"rk":46,"pw":1.7,"pwF":1.1,"wk":1.8,"src":"FP","pwP":2.2},{"id":"ty-simpson","n":"Ty Simpson","p":"QB","t":"LAR","b":11,"a":300.0,"f":16.1,"st":1.0,"tot":18,"rk":47,"pw":1.1,"pwF":1.1,"wk":1.2,"src":"F"},{"id":"drew-lock","n":"Drew Lock","p":"QB","t":"SEA","b":11,"a":300.0,"f":14.7,"st":1.0,"tot":17,"rk":48,"pw":1.1,"pwF":1.0,"wk":1.2,"src":"FP","pwP":1.3},{"id":"kyle-mccord","n":"Kyle McCord","p":"QB","t":"MIA","b":6,"a":300.0,"f":13.0,"st":1.0,"tot":18,"rk":49,"pw":1.4,"pwF":1.1,"wk":1.3,"src":"FP","pwP":1.6},{"id":"carson-wentz","n":"Carson Wentz","p":"QB","t":"MIN","b":6,"a":300.0,"f":16.5,"st":1.0,"tot":17,"rk":50,"fv":152,"rkB":37,"pw":5.0,"pwF":1.0,"pwB":8.9,"wk":5.0,"src":"FB"},{"id":"jacob-saylors","n":"Jacob Saylors","p":"RB","t":"DET","b":6,"a":300.0,"f":3.3,"st":17.0,"tot":56,"rk":67,"fv":68,"rkB":65,"pw":2.7,"pwF":3.3,"pwB":4.0,"wk":2.7,"src":"FBP","pwP":0.7},{"id":"tanner-mckee","n":"Tanner McKee","p":"QB","t":"PHI","b":10,"a":300.0,"fv":156,"rkB":0,"pw":5.3,"pwB":9.2,"wk":5.3,"src":"BP","pwP":1.5},{"id":"noah-gray","n":"Noah Gray","p":"TE","t":"KC","b":5,"a":300.0,"fv":75,"rkB":0,"pw":3.7,"pwB":4.4,"wk":3.7,"src":"BP","pwP":2.9},{"id":"kavontae-turpin","n":"KaVontae Turpin","p":"WR","t":"DAL","b":14,"a":300.0,"fv":73,"rkB":0,"pw":3.6,"pwB":4.3,"wk":3.6,"src":"BP","pwP":2.9},{"id":"kevin-coleman-jrqp","n":"Kevin Coleman Jr.QP","p":"WR","t":"MIA","b":6,"a":300.0,"fv":65,"rkB":0,"pw":3.8,"pwB":3.8,"wk":3.8,"src":"B"},{"id":"olamide-zaccheaus","n":"Olamide Zaccheaus","p":"WR","t":"ATL","b":11,"a":300.0,"fv":55,"rkB":0,"pw":3.4,"pwB":3.2,"wk":3.4,"src":"BP","pwP":3.5},{"id":"jalen-tolbert","n":"Jalen Tolbert","p":"WR","t":"MIA","b":6,"a":300.0,"fv":55,"rkB":0,"pw":2.5,"pwB":3.2,"wk":2.5,"src":"BP","pwP":1.8},{"id":"devontez-walker","n":"Devontez Walker","p":"WR","t":"BAL","b":13,"a":300.0,"fv":52,"rkB":0,"pw":3.1,"pwB":3.1,"wk":3.1,"src":"BP","pwP":3.1},{"id":"barion-brown","n":"Barion Brown","p":"WR","t":"NO","b":8,"a":300.0,"fv":50,"rkB":0,"pw":2.5,"pwB":2.9,"wk":2.5,"src":"BP","fl":"P","pwP":2.1},{"id":"commanders-def","n":"Commanders","p":"DEF","t":"WAS","b":7,"a":300.0,"f":5.5,"st":17.0,"tot":93,"rk":28,"pw":5.8,"pwF":5.5,"wk":5.8,"src":"FP","pwP":6.2},{"id":"panthers-def","n":"Panthers","p":"DEF","t":"CAR","b":5,"a":300.0,"f":5.4,"st":17.0,"tot":92,"rk":21,"pw":5.6,"pwF":5.4,"wk":5.6,"src":"FP","pwP":5.8},{"id":"raiders-def","n":"Raiders","p":"DEF","t":"LV","b":13,"a":300.0,"f":5.2,"st":17.0,"tot":89,"rk":30,"pw":5.7,"pwF":5.2,"wk":5.7,"src":"FP","pwP":6.2},{"id":"dolphins-def","n":"Dolphins","p":"DEF","t":"MIA","b":6,"a":300.0,"f":5.2,"st":17.0,"tot":88,"rk":31,"pw":5.5,"pwF":5.2,"wk":5.5,"src":"FP","pwP":5.8},{"id":"jets-def","n":"Jets","p":"DEF","t":"NYJ","b":13,"a":300.0,"f":5.2,"st":17.0,"tot":88,"rk":27,"pw":5.8,"pwF":5.2,"wk":5.8,"src":"FP","pwP":6.3},{"id":"cardinals-def","n":"Cardinals","p":"DEF","t":"ARI","b":14,"a":300.0,"f":5.1,"st":17.0,"tot":88,"rk":32,"pw":5.5,"pwF":5.2,"wk":5.4,"src":"FP","pwP":5.7}];
const NFL = {"1":{"NE":{"o":"SEA","h":0},"SEA":{"o":"NE","h":1},"SF":{"o":"LAR","h":0},"LAR":{"o":"SF","h":1},"CHI":{"o":"CAR","h":0},"CAR":{"o":"CHI","h":1},"TB":{"o":"CIN","h":0},"CIN":{"o":"TB","h":1},"NO":{"o":"DET","h":0},"DET":{"o":"NO","h":1},"BUF":{"o":"HOU","h":0},"HOU":{"o":"BUF","h":1},"BAL":{"o":"IND","h":0},"IND":{"o":"BAL","h":1},"CLE":{"o":"JAX","h":0},"JAX":{"o":"CLE","h":1},"ATL":{"o":"PIT","h":0},"PIT":{"o":"ATL","h":1},"NYJ":{"o":"TEN","h":0},"TEN":{"o":"NYJ","h":1},"MIA":{"o":"LV","h":0},"LV":{"o":"MIA","h":1},"ARI":{"o":"LAC","h":0},"LAC":{"o":"ARI","h":1},"GB":{"o":"MIN","h":0},"MIN":{"o":"GB","h":1},"WAS":{"o":"PHI","h":0},"PHI":{"o":"WAS","h":1},"DAL":{"o":"NYG","h":0},"NYG":{"o":"DAL","h":1},"DEN":{"o":"KC","h":0},"KC":{"o":"DEN","h":1}},"2":{"DET":{"o":"BUF","h":0},"BUF":{"o":"DET","h":1},"CAR":{"o":"ATL","h":0},"ATL":{"o":"CAR","h":1},"NO":{"o":"BAL","h":0},"BAL":{"o":"NO","h":1},"MIN":{"o":"CHI","h":0},"CHI":{"o":"MIN","h":1},"CIN":{"o":"HOU","h":0},"HOU":{"o":"CIN","h":1},"PIT":{"o":"NE","h":0},"NE":{"o":"PIT","h":1},"GB":{"o":"NYJ","h":0},"NYJ":{"o":"GB","h":1},"CLE":{"o":"TB","h":0},"TB":{"o":"CLE","h":1},"PHI":{"o":"TEN","h":0},"TEN":{"o":"PHI","h":1},"JAX":{"o":"DEN","h":0},"DEN":{"o":"JAX","h":1},"LV":{"o":"LAC","h":0},"LAC":{"o":"LV","h":1},"SEA":{"o":"ARI","h":0},"ARI":{"o":"SEA","h":1},"WAS":{"o":"DAL","h":0},"DAL":{"o":"WAS","h":1},"MIA":{"o":"SF","h":0},"SF":{"o":"MIA","h":1},"IND":{"o":"KC","h":0},"KC":{"o":"IND","h":1},"NYG":{"o":"LAR","h":0},"LAR":{"o":"NYG","h":1}},"3":{"ATL":{"o":"GB","h":0},"GB":{"o":"ATL","h":1},"LAC":{"o":"BUF","h":0},"BUF":{"o":"LAC","h":1},"CAR":{"o":"CLE","h":0},"CLE":{"o":"CAR","h":1},"NYJ":{"o":"DET","h":0},"DET":{"o":"NYJ","h":1},"HOU":{"o":"IND","h":0},"IND":{"o":"HOU","h":1},"NE":{"o":"JAX","h":0},"JAX":{"o":"NE","h":1},"KC":{"o":"MIA","h":0},"MIA":{"o":"KC","h":1},"TEN":{"o":"NYG","h":0},"NYG":{"o":"TEN","h":1},"CIN":{"o":"PIT","h":0},"PIT":{"o":"CIN","h":1},"SEA":{"o":"WAS","h":0},"WAS":{"o":"SEA","h":1},"ARI":{"o":"SF","h":0},"SF":{"o":"ARI","h":1},"MIN":{"o":"TB","h":0},"TB":{"o":"MIN","h":1},"BAL":{"o":"DAL","h":0},"DAL":{"o":"BAL","h":1},"LV":{"o":"NO","h":0},"NO":{"o":"LV","h":1},"LAR":{"o":"DEN","h":0},"DEN":{"o":"LAR","h":1},"PHI":{"o":"CHI","h":0},"CHI":{"o":"PHI","h":1}},"4":{"PIT":{"o":"CLE","h":0},"CLE":{"o":"PIT","h":1},"IND":{"o":"WAS","h":0},"WAS":{"o":"IND","h":1},"TEN":{"o":"BAL","h":0},"BAL":{"o":"TEN","h":1},"NE":{"o":"BUF","h":0},"BUF":{"o":"NE","h":1},"NYJ":{"o":"CHI","h":0},"CHI":{"o":"NYJ","h":1},"JAX":{"o":"CIN","h":0},"CIN":{"o":"JAX","h":1},"DAL":{"o":"HOU","h":0},"HOU":{"o":"DAL","h":1},"ARI":{"o":"NYG","h":0},"NYG":{"o":"ARI","h":1},"LAR":{"o":"PHI","h":0},"PHI":{"o":"LAR","h":1},"GB":{"o":"TB","h":0},"TB":{"o":"GB","h":1},"MIA":{"o":"MIN","h":0},"MIN":{"o":"MIA","h":1},"KC":{"o":"LV","h":0},"LV":{"o":"KC","h":1},"DEN":{"o":"SF","h":0},"SF":{"o":"DEN","h":1},"LAC":{"o":"SEA","h":0},"SEA":{"o":"LAC","h":1},"DET":{"o":"CAR","h":0},"CAR":{"o":"DET","h":1},"ATL":{"o":"NO","h":0},"NO":{"o":"ATL","h":1}},"5":{"TB":{"o":"DAL","h":0},"DAL":{"o":"TB","h":1},"PHI":{"o":"JAX","h":0},"JAX":{"o":"PHI","h":1},"CIN":{"o":"MIA","h":0},"MIA":{"o":"CIN","h":1},"LV":{"o":"NE","h":0},"NE":{"o":"LV","h":1},"MIN":{"o":"NO","h":0},"NO":{"o":"MIN","h":1},"CLE":{"o":"NYJ","h":0},"NYJ":{"o":"CLE","h":1},"IND":{"o":"PIT","h":0},"PIT":{"o":"IND","h":1},"HOU":{"o":"TEN","h":0},"TEN":{"o":"HOU","h":1},"NYG":{"o":"WAS","h":0},"WAS":{"o":"NYG","h":1},"DEN":{"o":"LAC","h":0},"LAC":{"o":"DEN","h":1},"DET":{"o":"ARI","h":0},"ARI":{"o":"DET","h":1},"CHI":{"o":"GB","h":0},"GB":{"o":"CHI","h":1},"SF":{"o":"SEA","h":0},"SEA":{"o":"SF","h":1},"BAL":{"o":"ATL","h":0},"ATL":{"o":"BAL","h":1},"BUF":{"o":"LAR","h":0},"LAR":{"o":"BUF","h":1}},"6":{"SEA":{"o":"DEN","h":0},"DEN":{"o":"SEA","h":1},"HOU":{"o":"JAX","h":0},"JAX":{"o":"HOU","h":1},"CHI":{"o":"ATL","h":0},"ATL":{"o":"CHI","h":1},"BAL":{"o":"CLE","h":0},"CLE":{"o":"BAL","h":1},"TEN":{"o":"IND","h":0},"IND":{"o":"TEN","h":1},"NYJ":{"o":"NE","h":0},"NE":{"o":"NYJ","h":1},"NO":{"o":"NYG","h":0},"NYG":{"o":"NO","h":1},"CAR":{"o":"PHI","h":0},"PHI":{"o":"CAR","h":1},"PIT":{"o":"TB","h":0},"TB":{"o":"PIT","h":1},"ARI":{"o":"LAR","h":0},"LAR":{"o":"ARI","h":1},"LAC":{"o":"KC","h":0},"KC":{"o":"LAC","h":1},"BUF":{"o":"LV","h":0},"LV":{"o":"BUF","h":1},"DAL":{"o":"GB","h":0},"GB":{"o":"DAL","h":1},"WAS":{"o":"SF","h":0},"SF":{"o":"WAS","h":1}},"7":{"NE":{"o":"CHI","h":0},"CHI":{"o":"NE","h":1},"PIT":{"o":"NO","h":0},"NO":{"o":"PIT","h":1},"SF":{"o":"ATL","h":0},"ATL":{"o":"SF","h":1},"CIN":{"o":"BAL","h":0},"BAL":{"o":"CIN","h":1},"TB":{"o":"CAR","h":0},"CAR":{"o":"TB","h":1},"NYG":{"o":"HOU","h":0},"HOU":{"o":"NYG","h":1},"IND":{"o":"MIN","h":0},"MIN":{"o":"IND","h":1},"MIA":{"o":"NYJ","h":0},"NYJ":{"o":"MIA","h":1},"CLE":{"o":"TEN","h":0},"TEN":{"o":"CLE","h":1},"DEN":{"o":"ARI","h":0},"ARI":{"o":"DEN","h":1},"GB":{"o":"DET","h":0},"DET":{"o":"GB","h":1},"LAR":{"o":"LV","h":0},"LV":{"o":"LAR","h":1},"KC":{"o":"SEA","h":0},"SEA":{"o":"KC","h":1},"DAL":{"o":"PHI","h":0},"PHI":{"o":"DAL","h":1}},"8":{"CAR":{"o":"GB","h":0},"GB":{"o":"CAR","h":1},"BAL":{"o":"BUF","h":0},"BUF":{"o":"BAL","h":1},"TEN":{"o":"CIN","h":0},"CIN":{"o":"TEN","h":1},"ARI":{"o":"DAL","h":0},"DAL":{"o":"ARI","h":1},"MIN":{"o":"DET","h":0},"DET":{"o":"MIN","h":1},"IND":{"o":"JAX","h":0},"JAX":{"o":"IND","h":1},"LV":{"o":"NYJ","h":0},"NYJ":{"o":"LV","h":1},"CLE":{"o":"PIT","h":0},"PIT":{"o":"CLE","h":1},"ATL":{"o":"TB","h":0},"TB":{"o":"ATL","h":1},"LAC":{"o":"LAR","h":0},"LAR":{"o":"LAC","h":1},"KC":{"o":"DEN","h":0},"DEN":{"o":"KC","h":1},"NE":{"o":"MIA","h":0},"MIA":{"o":"NE","h":1},"PHI":{"o":"WAS","h":0},"WAS":{"o":"PHI","h":1},"CHI":{"o":"SEA","h":0},"SEA":{"o":"CHI","h":1}},"9":{"JAX":{"o":"BAL","h":0},"BAL":{"o":"JAX","h":1},"CIN":{"o":"ATL","h":0},"ATL":{"o":"CIN","h":1},"DEN":{"o":"CAR","h":0},"CAR":{"o":"DEN","h":1},"DAL":{"o":"IND","h":0},"IND":{"o":"DAL","h":1},"NYJ":{"o":"KC","h":0},"KC":{"o":"NYJ","h":1},"DET":{"o":"MIA","h":0},"MIA":{"o":"DET","h":1},"CLE":{"o":"NO","h":0},"NO":{"o":"CLE","h":1},"NYG":{"o":"PHI","h":0},"PHI":{"o":"NYG","h":1},"LAR":{"o":"WAS","h":0},"WAS":{"o":"LAR","h":1},"HOU":{"o":"LAC","h":0},"LAC":{"o":"HOU","h":1},"LV":{"o":"SF","h":0},"SF":{"o":"LV","h":1},"GB":{"o":"NE","h":0},"NE":{"o":"GB","h":1},"ARI":{"o":"SEA","h":0},"SEA":{"o":"ARI","h":1},"TB":{"o":"CHI","h":0},"CHI":{"o":"TB","h":1},"BUF":{"o":"MIN","h":0},"MIN":{"o":"BUF","h":1}},"10":{"WAS":{"o":"NYG","h":0},"NYG":{"o":"WAS","h":1},"NE":{"o":"DET","h":0},"DET":{"o":"NE","h":1},"KC":{"o":"ATL","h":0},"ATL":{"o":"KC","h":1},"HOU":{"o":"CLE","h":0},"CLE":{"o":"HOU","h":1},"MIN":{"o":"GB","h":0},"GB":{"o":"MIN","h":1},"MIA":{"o":"IND","h":0},"IND":{"o":"MIA","h":1},"CAR":{"o":"NO","h":0},"NO":{"o":"CAR","h":1},"BUF":{"o":"NYJ","h":0},"NYJ":{"o":"BUF","h":1},"JAX":{"o":"TEN","h":0},"TEN":{"o":"JAX","h":1},"LAR":{"o":"ARI","h":0},"ARI":{"o":"LAR","h":1},"SEA":{"o":"LV","h":0},"LV":{"o":"SEA","h":1},"SF":{"o":"DAL","h":0},"DAL":{"o":"SF","h":1},"PIT":{"o":"CIN","h":0},"CIN":{"o":"PIT","h":1},"LAC":{"o":"BAL","h":0},"BAL":{"o":"LAC","h":1}},"11":{"IND":{"o":"HOU","h":0},"HOU":{"o":"IND","h":1},"MIA":{"o":"BUF","h":0},"BUF":{"o":"MIA","h":1},"BAL":{"o":"CAR","h":0},"CAR":{"o":"BAL","h":1},"NO":{"o":"CHI","h":0},"CHI":{"o":"NO","h":1},"TEN":{"o":"DAL","h":0},"DAL":{"o":"TEN","h":1},"TB":{"o":"DET","h":0},"DET":{"o":"TB","h":1},"ARI":{"o":"KC","h":0},"KC":{"o":"ARI","h":1},"JAX":{"o":"NYG","h":0},"NYG":{"o":"JAX","h":1},"NYJ":{"o":"LAC","h":0},"LAC":{"o":"NYJ","h":1},"LV":{"o":"DEN","h":0},"DEN":{"o":"LV","h":1},"PIT":{"o":"PHI","h":0},"PHI":{"o":"PIT","h":1},"MIN":{"o":"SF","h":0},"SF":{"o":"MIN","h":1},"CIN":{"o":"WAS","h":0},"WAS":{"o":"CIN","h":1}},"12":{"GB":{"o":"LAR","h":0},"LAR":{"o":"GB","h":1},"CHI":{"o":"DET","h":0},"DET":{"o":"CHI","h":1},"PHI":{"o":"DAL","h":0},"DAL":{"o":"PHI","h":1},"KC":{"o":"BUF","h":0},"BUF":{"o":"KC","h":1},"DEN":{"o":"PIT","h":0},"PIT":{"o":"DEN","h":1},"NO":{"o":"CIN","h":0},"CIN":{"o":"NO","h":1},"LV":{"o":"CLE","h":0},"CLE":{"o":"LV","h":1},"BAL":{"o":"HOU","h":0},"HOU":{"o":"BAL","h":1},"NYG":{"o":"IND","h":0},"IND":{"o":"NYG","h":1},"NYJ":{"o":"MIA","h":0},"MIA":{"o":"NYJ","h":1},"ATL":{"o":"MIN","h":0},"MIN":{"o":"ATL","h":1},"TEN":{"o":"JAX","h":0},"JAX":{"o":"TEN","h":1},"WAS":{"o":"ARI","h":0},"ARI":{"o":"WAS","h":1},"SEA":{"o":"SF","h":0},"SF":{"o":"SEA","h":1},"NE":{"o":"LAC","h":0},"LAC":{"o":"NE","h":1},"CAR":{"o":"TB","h":0},"TB":{"o":"CAR","h":1}},"13":{"KC":{"o":"LAR","h":0},"LAR":{"o":"KC","h":1},"DET":{"o":"ATL","h":0},"ATL":{"o":"DET","h":1},"JAX":{"o":"CHI","h":0},"CHI":{"o":"JAX","h":1},"CIN":{"o":"CLE","h":0},"CLE":{"o":"CIN","h":1},"GB":{"o":"NO","h":0},"NO":{"o":"GB","h":1},"SF":{"o":"NYG","h":0},"NYG":{"o":"SF","h":1},"LAC":{"o":"TB","h":0},"TB":{"o":"LAC","h":1},"WAS":{"o":"TEN","h":0},"TEN":{"o":"WAS","h":1},"PHI":{"o":"ARI","h":0},"ARI":{"o":"PHI","h":1},"MIA":{"o":"DEN","h":0},"DEN":{"o":"MIA","h":1},"CAR":{"o":"MIN","h":0},"MIN":{"o":"CAR","h":1},"BUF":{"o":"NE","h":0},"NE":{"o":"BUF","h":1},"HOU":{"o":"PIT","h":0},"PIT":{"o":"HOU","h":1},"DAL":{"o":"SEA","h":0},"SEA":{"o":"DAL","h":1}},"14":{"MIN":{"o":"NE","h":0},"NE":{"o":"MIN","h":1},"TB":{"o":"BAL","h":0},"BAL":{"o":"TB","h":1},"NO":{"o":"CAR","h":0},"CAR":{"o":"NO","h":1},"ATL":{"o":"CLE","h":0},"CLE":{"o":"ATL","h":1},"TEN":{"o":"DET","h":0},"DET":{"o":"TEN","h":1},"CHI":{"o":"MIA","h":0},"MIA":{"o":"CHI","h":1},"DEN":{"o":"NYJ","h":0},"NYJ":{"o":"DEN","h":1},"IND":{"o":"PHI","h":0},"PHI":{"o":"IND","h":1},"HOU":{"o":"WAS","h":0},"WAS":{"o":"HOU","h":1},"LAC":{"o":"LV","h":0},"LV":{"o":"LAC","h":1},"KC":{"o":"CIN","h":0},"CIN":{"o":"KC","h":1},"LAR":{"o":"SF","h":0},"SF":{"o":"LAR","h":1},"NYG":{"o":"SEA","h":0},"SEA":{"o":"NYG","h":1},"BUF":{"o":"GB","h":0},"GB":{"o":"BUF","h":1},"PIT":{"o":"JAX","h":0},"JAX":{"o":"PIT","h":1}},"15":{"SF":{"o":"LAC","h":0},"LAC":{"o":"SF","h":1},"SEA":{"o":"PHI","h":0},"PHI":{"o":"SEA","h":1},"CHI":{"o":"BUF","h":0},"BUF":{"o":"CHI","h":1},"CIN":{"o":"CAR","h":0},"CAR":{"o":"CIN","h":1},"MIA":{"o":"GB","h":0},"GB":{"o":"MIA","h":1},"JAX":{"o":"HOU","h":0},"HOU":{"o":"JAX","h":1},"CLE":{"o":"NYG","h":0},"NYG":{"o":"CLE","h":1},"BAL":{"o":"PIT","h":0},"PIT":{"o":"BAL","h":1},"NO":{"o":"TB","h":0},"TB":{"o":"NO","h":1},"IND":{"o":"TEN","h":0},"TEN":{"o":"IND","h":1},"ATL":{"o":"WAS","h":0},"WAS":{"o":"ATL","h":1},"NYJ":{"o":"ARI","h":0},"ARI":{"o":"NYJ","h":1},"DEN":{"o":"LV","h":0},"LV":{"o":"DEN","h":1},"DAL":{"o":"LAR","h":0},"LAR":{"o":"DAL","h":1},"DET":{"o":"MIN","h":0},"MIN":{"o":"DET","h":1},"NE":{"o":"KC","h":0},"KC":{"o":"NE","h":1}},"16":{"HOU":{"o":"PHI","h":0},"PHI":{"o":"HOU","h":1},"GB":{"o":"CHI","h":0},"CHI":{"o":"GB","h":1},"BUF":{"o":"DEN","h":0},"DEN":{"o":"BUF","h":1},"LAR":{"o":"SEA","h":0},"SEA":{"o":"LAR","h":1},"CLE":{"o":"BAL","h":0},"BAL":{"o":"CLE","h":1},"LAC":{"o":"MIA","h":0},"MIA":{"o":"LAC","h":1},"ARI":{"o":"NO","h":0},"NO":{"o":"ARI","h":1},"NE":{"o":"NYJ","h":0},"NYJ":{"o":"NE","h":1},"TEN":{"o":"LV","h":0},"LV":{"o":"TEN","h":1},"SF":{"o":"KC","h":0},"KC":{"o":"SF","h":1},"JAX":{"o":"DAL","h":0},"DAL":{"o":"JAX","h":1},"NYG":{"o":"DET","h":0},"DET":{"o":"NYG","h":1},"TB":{"o":"ATL","h":0},"ATL":{"o":"TB","h":1},"CIN":{"o":"IND","h":0},"IND":{"o":"CIN","h":1},"WAS":{"o":"MIN","h":0},"MIN":{"o":"WAS","h":1},"CAR":{"o":"PIT","h":0},"PIT":{"o":"CAR","h":1}},"17":{"BAL":{"o":"CIN","h":0},"CIN":{"o":"BAL","h":1},"LAR":{"o":"TB","h":0},"TB":{"o":"LAR","h":1},"NO":{"o":"ATL","h":0},"ATL":{"o":"NO","h":1},"SEA":{"o":"CAR","h":0},"CAR":{"o":"SEA","h":1},"IND":{"o":"CLE","h":0},"CLE":{"o":"IND","h":1},"NYG":{"o":"DAL","h":0},"DAL":{"o":"NYG","h":1},"BUF":{"o":"MIA","h":0},"MIA":{"o":"BUF","h":1},"MIN":{"o":"NYJ","h":0},"NYJ":{"o":"MIN","h":1},"PIT":{"o":"TEN","h":0},"TEN":{"o":"PIT","h":1},"LV":{"o":"ARI","h":0},"ARI":{"o":"LV","h":1},"DET":{"o":"CHI","h":0},"CHI":{"o":"DET","h":1},"PHI":{"o":"SF","h":0},"SF":{"o":"PHI","h":1},"HOU":{"o":"GB","h":0},"GB":{"o":"HOU","h":1},"WAS":{"o":"JAX","h":0},"JAX":{"o":"WAS","h":1},"KC":{"o":"LAC","h":0},"LAC":{"o":"KC","h":1},"DEN":{"o":"NE","h":0},"NE":{"o":"DEN","h":1}},"18":{"SF":{"o":"ARI","h":0},"ARI":{"o":"SF","h":1},"PIT":{"o":"BAL","h":0},"BAL":{"o":"PIT","h":1},"NYJ":{"o":"BUF","h":0},"BUF":{"o":"NYJ","h":1},"ATL":{"o":"CAR","h":0},"CAR":{"o":"ATL","h":1},"CLE":{"o":"CIN","h":0},"CIN":{"o":"CLE","h":1},"LAC":{"o":"DEN","h":0},"DEN":{"o":"LAC","h":1},"DET":{"o":"GB","h":0},"GB":{"o":"DET","h":1},"TEN":{"o":"HOU","h":0},"HOU":{"o":"TEN","h":1},"JAX":{"o":"IND","h":0},"IND":{"o":"JAX","h":1},"LV":{"o":"KC","h":0},"KC":{"o":"LV","h":1},"SEA":{"o":"LAR","h":0},"LAR":{"o":"SEA","h":1},"CHI":{"o":"MIN","h":0},"MIN":{"o":"CHI","h":1},"MIA":{"o":"NE","h":0},"NE":{"o":"MIA","h":1},"TB":{"o":"NO","h":0},"NO":{"o":"TB","h":1},"PHI":{"o":"NYG","h":0},"NYG":{"o":"PHI","h":1},"DAL":{"o":"WAS","h":0},"WAS":{"o":"DAL","h":1}}};
const TEAMS_INIT = {"What Would Breesus Do":{"r":["jahmyr-gibbs","trey-mcbride","tee-higgins","david-montgomery","parker-washington","dak-prescott","tony-pollard","kenny-gainwell","makai-lemon","woody-marks","rashid-shaheed","terrance-ferguson","jalen-mcmillan","jacoby-brissett","tj-hockenson","chris-boswell"],"d":{"jahmyr-gibbs":"1.01","trey-mcbride":"2.14","tee-higgins":"3.01","david-montgomery":"4.14","parker-washington":"5.01","dak-prescott":"6.14","tony-pollard":"7.01","kenny-gainwell":"8.14","makai-lemon":"9.01","woody-marks":"10.14","rashid-shaheed":"11.01","terrance-ferguson":"12.14","jalen-mcmillan":"13.01","jacoby-brissett":"14.14","tj-hockenson":"15.01","chris-boswell":"16.14"}},"The Fun Brunch":{"r":["bijan-robinson","chris-olave","devonta-smith","quinshon-judkins","rome-odunze","trevor-lawrence","josh-downs","jordan-addison","isaiah-likely","jonah-coleman","emmett-johnson","tyler-shough","dontayvion-wicks","jaguars-def","cameron-dicker","kimani-vidal"],"d":{"bijan-robinson":"1.02","chris-olave":"2.13","devonta-smith":"3.02","quinshon-judkins":"4.13","rome-odunze":"5.02","trevor-lawrence":"6.13","josh-downs":"7.02","jordan-addison":"8.13","isaiah-likely":"9.02","jonah-coleman":"10.13","emmett-johnson":"11.02","tyler-shough":"12.13","dontayvion-wicks":"13.02","jaguars-def":"14.13","cameron-dicker":"15.02","kimani-vidal":"16.13"}},"Spictaculous":{"r":["jamarr-chase","travis-etienne-jr","malik-nabers","bhayshul-tuten","marshawn-lloyd","jonathon-brooks","jaxson-dart","wandale-robinson","jalen-coker","tank-bigsby","brandon-aubrey","daniel-jones","patriots-def","jalen-nailor","pat-freiermuth","malachi-fields"],"d":{"jamarr-chase":"1.03","travis-etienne-jr":"2.12","malik-nabers":"3.03","bhayshul-tuten":"4.12","marshawn-lloyd":"5.03","jonathon-brooks":"6.12","jaxson-dart":"7.03","wandale-robinson":"8.12","jalen-coker":"9.03","tank-bigsby":"10.12","brandon-aubrey":"11.03","daniel-jones":"12.12","patriots-def":"13.03","jalen-nailor":"14.12","pat-freiermuth":"15.03","malachi-fields":"16.12"}},"2 Cups of Rice":{"r":["christian-mccaffrey","aj-brown","breece-hall","christian-watson","tucker-kraft","michael-wilson","jk-dobbins","jared-goff","michael-pittman-jr","keenan-allen","malik-washington","chargers-def","greg-dulcich","cam-ward","nick-folk","kaytron-allen"],"d":{"christian-mccaffrey":"1.04","aj-brown":"2.11","breece-hall":"3.04","christian-watson":"4.11","tucker-kraft":"5.04","michael-wilson":"6.11","jk-dobbins":"7.04","jared-goff":"8.11","michael-pittman-jr":"9.04","keenan-allen":"10.11","malik-washington":"11.04","chargers-def":"12.11","greg-dulcich":"13.04","cam-ward":"14.11","nick-folk":"15.04","kaytron-allen":"16.11"}},"Team Riggo":{"r":["james-cook-iii","javonte-williams","zay-flowers","davante-adams","mike-evans","kyle-pitts-sr","justin-herbert","texans-def","kyle-monangai","mike-washington-jr","baker-mayfield","deebo-samuel-sr","hunter-henry","alvin-kamara","malik-davis","harrison-mevis"],"d":{"james-cook-iii":"1.05","javonte-williams":"2.10","zay-flowers":"3.05","davante-adams":"4.10","mike-evans":"5.05","kyle-pitts-sr":"6.10","justin-herbert":"7.05","texans-def":"8.10","kyle-monangai":"9.05","mike-washington-jr":"10.10","baker-mayfield":"11.05","deebo-samuel-sr":"12.10","hunter-henry":"13.05","alvin-kamara":"14.10","malik-davis":"15.05","harrison-mevis":"16.10"}},"BIG DADDY":{"r":["puka-nacua","drake-london","jeremiyah-love","dj-moore","jameson-williams","jayden-daniels","george-kittle","jordan-mason","matthew-golden","keaton-mitchell","malik-willis","dalton-schultz","ray-davis","pat-bryant","ravens-def","evan-mcpherson"],"d":{"puka-nacua":"1.06","drake-london":"2.09","jeremiyah-love":"3.06","dj-moore":"4.09","jameson-williams":"5.06","jayden-daniels":"6.09","george-kittle":"7.06","jordan-mason":"8.09","matthew-golden":"9.06","keaton-mitchell":"10.09","malik-willis":"11.06","dalton-schultz":"12.09","ray-davis":"13.06","pat-bryant":"14.09","ravens-def":"15.06","evan-mcpherson":"16.09"}},"SOULTRAIN":{"r":["jaxon-smith-njigba","george-pickens","dandre-swift","jaylen-warren","chuba-hubbard","harold-fannin-jr","rj-harvey","bo-nix","romeo-doubs","khalil-shakir","juwan-johnson","eagles-def","bryce-young","kaimi-fairbairn","jacob-saylors","cyrus-allen"],"d":{"jaxon-smith-njigba":"1.07","george-pickens":"2.08","dandre-swift":"3.07","jaylen-warren":"4.08","chuba-hubbard":"5.07","harold-fannin-jr":"6.08","rj-harvey":"7.07","bo-nix":"8.08","romeo-doubs":"9.07","khalil-shakir":"10.08","juwan-johnson":"11.07","eagles-def":"12.08","bryce-young":"13.07","kaimi-fairbairn":"14.08","jacob-saylors":"15.07","cyrus-allen":"16.08"}},"Knappachino":{"r":["jonathan-taylor","kyren-williams","jaylen-waddle","jadarian-price","quentin-johnston","caleb-williams","mark-andrews","jayden-reed","xavier-worthy","jordan-love","bengals-def","cairo-santos","kenyon-sadiq","cj-stroud","kaleb-johnson","bills-def"],"d":{"jonathan-taylor":"1.08","kyren-williams":"2.07","jaylen-waddle":"3.08","jadarian-price":"4.07","quentin-johnston":"5.08","caleb-williams":"6.07","mark-andrews":"7.08","jayden-reed":"8.07","xavier-worthy":"9.08","jordan-love":"10.07","bengals-def":"11.08","cairo-santos":"12.07","kenyon-sadiq":"13.08","cj-stroud":"14.07","kaleb-johnson":"15.08","bills-def":"16.07"}},"Donnie Dimes":{"r":["amon-ra-st-brown","brock-bowers","josh-allen","luther-burden-iii","treveyon-henderson","rico-dowdle","josh-jacobs","kc-concepcion","chris-rodriguez-jr","jordyn-tyson","seahawks-def","najee-harris","devaughn-vele","eddy-pineiro","caleb-douglas","chris-brooks"],"d":{"amon-ra-st-brown":"1.09","brock-bowers":"2.06","josh-allen":"3.09","luther-burden-iii":"4.06","treveyon-henderson":"5.09","rico-dowdle":"6.06","josh-jacobs":"7.09","kc-concepcion":"8.06","chris-rodriguez-jr":"9.09","jordyn-tyson":"10.06","seahawks-def":"11.09","najee-harris":"12.06","devaughn-vele":"13.09","eddy-pineiro":"14.06","caleb-douglas":"15.09","chris-brooks":"16.06"}},"Underdog":{"r":["saquon-barkley","ashton-jeanty","cam-skattebo","tyler-warren","marvin-harrison-jr","chris-godwin-jr","stefon-diggs","courtland-sutton","matthew-stafford","tyler-allgeier","tyjae-spears","chig-okonkwo","jakobi-lane","kayshon-boutte","lions-def","wil-lutz"],"d":{"saquon-barkley":"1.10","ashton-jeanty":"2.05","cam-skattebo":"3.10","tyler-warren":"4.05","marvin-harrison-jr":"5.10","chris-godwin-jr":"6.05","stefon-diggs":"7.10","courtland-sutton":"8.05","matthew-stafford":"9.10","tyler-allgeier":"10.05","tyjae-spears":"11.10","chig-okonkwo":"12.05","jakobi-lane":"13.10","kayshon-boutte":"14.05","lions-def":"15.10","wil-lutz":"16.05"}},"USC_Nemo":{"r":["kenneth-walker-iii","nico-collins","bucky-irving","terry-mclaurin","lamar-jackson","dk-metcalf","patrick-mahomes","travis-kelce","dallas-goedert","jason-myers","broncos-def","tyrone-tracy-jr","jauan-jennings","dylan-sampson","isaac-teslaa","oronde-gadsden"],"d":{"kenneth-walker-iii":"1.11","nico-collins":"2.04","bucky-irving":"3.11","terry-mclaurin":"4.04","lamar-jackson":"5.11","dk-metcalf":"6.04","patrick-mahomes":"7.11","travis-kelce":"8.04","dallas-goedert":"9.11","jason-myers":"10.04","broncos-def":"11.11","tyrone-tracy-jr":"12.04","jauan-jennings":"13.11","dylan-sampson":"14.04","isaac-teslaa":"15.11","oronde-gadsden":"16.04"}},"Nothing Else Matters":{"r":["ceedee-lamb","devon-achane","garrett-wilson","emeka-egbuka","drake-maye","brian-thomas-jr","jacory-croskey-merritt","dalton-kincaid","brock-purdy","aaron-jones-sr","tre-tucker","zach-charbonnet","brenton-strange","kaelon-black","vikings-def","will-reichard"],"d":{"ceedee-lamb":"1.12","devon-achane":"2.03","garrett-wilson":"3.12","emeka-egbuka":"4.03","drake-maye":"5.12","brian-thomas-jr":"6.03","jacory-croskey-merritt":"7.12","dalton-kincaid":"8.03","brock-purdy":"9.12","aaron-jones-sr":"10.03","tre-tucker":"11.12","zach-charbonnet":"12.03","brenton-strange":"13.12","kaelon-black":"14.03","vikings-def":"15.12","will-reichard":"16.03"}},"The Manglers":{"r":["derrick-henry","omarion-hampton","tetairoa-mcmillan","ladd-mcconkey","joe-burrow","sam-laporta","blake-corum","alec-pierce","rams-def","jakobi-meyers","sam-darnold","jake-ferguson","cam-little","braelon-allen","ryan-flournoy","travis-hunter"],"d":{"derrick-henry":"1.13","omarion-hampton":"2.02","tetairoa-mcmillan":"3.13","ladd-mcconkey":"4.02","joe-burrow":"5.13","sam-laporta":"6.02","blake-corum":"7.13","alec-pierce":"8.02","rams-def":"9.13","jakobi-meyers":"10.02","sam-darnold":"11.13","jake-ferguson":"12.02","cam-little":"13.13","braelon-allen":"14.02","ryan-flournoy":"15.13","travis-hunter":"16.02"}},"Brafferton Beast II":{"r":["justin-jefferson","chase-brown","colston-loveland","rashee-rice","rhamondre-stevenson","jalen-hurts","carnell-tate","dezhaun-stribling","rachaad-white","kyler-murray","denzel-boston","adonai-mitchell","aj-barner","brian-robinson","steelers-def","tyler-loop"],"d":{"justin-jefferson":"1.14","chase-brown":"2.01","colston-loveland":"3.14","rashee-rice":"4.01","rhamondre-stevenson":"5.14","jalen-hurts":"6.01","carnell-tate":"7.14","dezhaun-stribling":"8.01","rachaad-white":"9.14","kyler-murray":"10.01","denzel-boston":"11.14","adonai-mitchell":"12.01","aj-barner":"13.14","brian-robinson":"14.01","steelers-def":"15.14","tyler-loop":"16.01"}}};
const NEWS = [{"t":"ARI","x":"Mike LaFleur has been optimistic that Jeremiyah Love will be recovered from his high ankle sprain in time for Week 1, but it's far from certain. The 3rd overall pick got hurt in his preseason debut on August 13, a game in which he looked like exactly what Arizona hoped it was drafting – 14 touches, 73 scrimmage yards. He was able to do some side work in Green Bay before the preseason finale. He remains a great season-long option, but a real chance the first few weeks are a ramp-up rather than a workload."},{"t":"ARI","x":"Tyler Allgeier will see work either way. Arizona signed him to a two-year deal worth $12.25 million in the offseason, and he was already lined up for short-yardage duties even with Love healthy. He's not dynamic, but he catches what's thrown to him, having converted 45 of 52 targets for 377 yards in that span. He'll be a starter-quality option in any week Love sits. Bam Knight will be the No. 3, with James Conner on injured reserve and missing at least four games while he finishes rehabbing his ankle injury that ended his 2025 season."},{"t":"ARI","x":"Arizona signed Michael Wilson to a three-year, $75 million extension on Thursday, with $47 million guaranteed, keeping him through 2029. It's a fair reward for a third-year breakout: 78 catches for 1,006 yards and 7 touchdowns on a career-high 126 targets. He was better as the year went on and the Cardinals fell out of it, with his target share climbing from 11.0 percent over the first five weeks to 23.2 percent from Week 6 on – a stretch in which Marvin Harrison missed five games. Jacoby Brissett isn't an exciting pick, but Arizona finished 7th in passing yards last season for a reason: this team is going to be trailing a lot again. There should be enough volume to go around for Wilson, Harrison, and Trey McBride."},{"t":"ATL","x":"As of this writing, Atlanta still hasn't named a Week 1 starter between Michael Penix and Tua Tagovailoa, though ESPN’s Jeremy Fowler reported the decision could come as early as Monday. Penix was cleared for 11-on-11 work only in the last week of August and had just three practices under his belt before the preseason finale, which he sat out. He wasn't good in nine starts last year either, averaging 220 passing yards while going 3-6, with just 9 touchdowns, 3 interceptions, and a 60.1 completion percentage. Tagovailoa hasn't made a case, completing 10 of 13 for 117 yards while losing 2 fumbles in the preseason. Neither looks like a viable fantasy choice."},{"t":"ATL","x":"What it does mean is a heavy dose of Bijan Robinson early on, and probably throughout. Robinson sat out the entire preseason – he's healthy, but the Falcons weren't risking anything after signing him to an extension at the start of camp. He's our 2nd-ranked running back and the 2nd pick in most drafts. Brian Robinson is locked in as the No. 2; Atlanta cut No. 3 Tyler Goodson. Goodson is on the practice squad, and will presumably be promoted before the opener."},{"t":"BAL","x":"Zay Flowers returned to practice Thursday after sitting with an undisclosed lower-body injury. He also missed time in camp with a quad bruise, and while the Ravens haven't shown any concern about Week 1 at Indianapolis, two separate issues in one summer are worth filing away. For what it's worth, Flowers has been a fast starter: he's averaged 7 catches for 86 yards in his three career openers, including a 143-yard, 1-touchdown game against Buffalo to open 2025."},{"t":"BAL","x":"Baltimore opens with a three-man backfield after placing Adam Randall on injured reserve. The fifth-round pick could be back after four games depending on the severity of his undisclosed injury, and given the ages of Derrick Henry and Justice Hill, he's worth a stash in dynasty. Rasheen Ali opens as the No. 3 back."},{"t":"BAL","x":"Tyler Loop opens the year as the kicker, but he's on notice after the Ravens signed Jake Moody to the practice squad three days after Loop missed two kicks in the preseason finale and got booed at home. Loop went 5 of 8 in the preseason with misses from 49, 51 and 58 yards, which is the same problem he had as a rookie – 1 for 4 from 50 and beyond, and a missed 44-yarder on the final play at Pittsburgh that cost Baltimore a playoff spot. Jesse Minter said he expects Loop to kick in Indianapolis, but Moody made 10 of 11 field goals for Washington last season before losing a camp battle to an undrafted rookie this summer, and he's a legitimate replacement if this continues. Loop is a playable kicker, but also has more risk than you’d want if he’s your only kicker option."},{"t":"BUF","x":"It remains unclear whether Khalil Shakir will play in Week 1. He's been out of practice for weeks with an undisclosed injury – Buffalo doesn't have to file an official report until Wednesday – though there's currently optimism he'll be available at Houston. If Shakir sits, it's good news for DJ Moore's target share in his Bills debut. Behind them are Keon Coleman, Joshua Palmer, and rookie Skyler Bell. they've added Greg Dortch to the practice squad."},{"t":"BUF","x":"The backfield has an injury question too. Ty Johnson hasn't been in full pads since hurting his right knee on August 8 and was still out of practice this week, though he's resumed running and there's hope for Week 1. It doesn't change much regardless: Ray Davis is the backup worth rostering behind James Cook, and likely lead back if the starter misses time."},{"t":"CAR","x":"Carolina enters the year with a two-headed backfield in Chuba Hubbard and Jonathon Brooks, and both are trending the right way on the injury front. Hubbard returned to practice this week after missing multiple weeks with a hamstring strain. Brooks has been working off to the side with soreness, which is worth watching – he last did full work at a joint practice nearly a week earlier. Canales has said that if both are good to go, it will be a committee in Week 1 against Chicago. Brooks has played only three games since being drafted in 2024, having torn his right ACL for the second time in Week 14 of his rookie year and missed all of last year. The two have flip-flopped in our rankings lately, with Brooks seemingly taking charge of this backfield until he, too, developed an injury issue. Both carry real upside if the other goes down. AJ Dillon opens as the No. 3 (with Trevor Etienne on injured reserve for the first four games), likely moving up into a tandem if one of the top backs is sidelined."},{"t":"CAR","x":"Darren Waller looks like he'll be ready for Week 1 after signing on August 12, as he got more work with the first team last week. Carolina kept five tight ends, including Ja'Tavion Sanders and Tommy Tremble, which cuts into everyone's usage. Waller's track record makes him the most interesting of the group, having showed last season in Miami that he can still find the end zone, with 6 touchdowns in 9 games. A name to remember in TD-heavy scoring systems."},{"t":"CHI","x":"Everything appears fine, but Chicago had two injury scares in Thursday's practice. D'Andre Swift left with abdominal discomfort that was diagnosed as a cramp, and Rome Odunze left with a right leg injury but is expected to be okay. Those concerns came on the heels of Luther Burden missing most of camp. He suffered a groin injury on August 8 and sat out the entire preseason, but he practiced this week and Ben Johnson said he looks 100 percent. With DJ Moore gone, Burden steps up the depth chart and should see a real workload bump in his second season, and he finished his rookie year with some momentum – 34 receptions for 481 yards over his last 8 games."},{"t":"CHI","x":"Kyle Monangai is less certain for Week 1. He hasn't practiced since hyperextending his right knee on August 16, and while he resumed running this week, it's an open question whether he gets back to full practice before the opener. If he can't go against Carolina, Roschon Johnson would be Swift's primary backup. Don't dismiss Monangai on account of the depth-chart label: we project him as possible starter in deeper leagues, and an excellent one if anything happens to Swift."},{"t":"CIN","x":"It's not what Bengals fans want to hear, but Ja'Marr Chase (knee) and Tee Higgins (heel) weren't full participants in practice this week. Chase was limited, though Zac Taylor sounded optimistic about Week 1; the team is saying similar things about Higgins, who sat out entirely. There's no real alarm yet, but the practice reports leading into the opener against Tampa Bay are worth watching. Should either miss time, Andrei Iosivas would see more action, but he would not be a comparable fill-in."},{"t":"CIN","x":"Look for a very heavy workload for Chase Brown with Joe Burrow healthy. There's been buzz about Brown lining up in the slot more often in camp, and last season's 301 touches may have been only the beginning. He got better as Burrow got healthy: over the last six games of 2025, Brown averaged 19 touches for 96 yards and scored 8 of his 11 touchdowns. He's a clear top-10 back, just behind the position's top tier. Samaje Perine should be a change-of-pace, while second-year back Tahj Brooks would move up if one of the top 2 misses time."},{"t":"CLE","x":"The Browns open with Deshaun Watson, Shedeur Sanders and Taylen Green at quarterback, with Dillon Gabriel on injured reserve (designated to return) because of a back injury suffered in the preseason finale against New England. Todd Monken named Watson the starter on August 24, going with experience and familiarity even though Sanders was widely seen as the better performer this summer. Watson will be under a microscope: he's coming off a torn Achilles, completed only 16 of 27 passes for 162 yards with an interception in two preseason games, and managed to criticize the fanbase along the way. He's played only 19 games in four seasons since arriving in 2022, and it could be a matter of weeks before Sanders takes over – Cleveland opens with two road games. None of it matters much in fantasy unless you’re in a Superflex league; neither is a recommended option."},{"t":"CLE","x":"Not surprisingly, rookies will be a big part of the offense. KC Concepcion and Denzel Boston will both play a lot at wide receiver alongside Jerry Jeudy. Concepcion flashed in his one preseason appearance – 3 catches for 27 yards, a 14-yard rushing touchdown and a 31-yard punt return. Boston caught one pass for 15 yards in two appearances, but drew steady praise at camp practices. Neither can be considered safe starters in a passing offense this shaky, but both merit a late-round dart throw. Even Jeudy barely sneaks in as a viable option, hinting at the low expectations for the passing game as a whole."},{"t":"DAL","x":"The roster cuts produced a couple of surprises, with the Cowboys waiving running backs Jaydon Blue and Phil Mafah on Sunday. Blue entered camp as the No. 2 back, dealt with a shoulder injury for part of it, but just never really seized the opportunity. Brian Schottenheimer framed it as Malik Davis winning the job rather than Blue losing it, although notable that Dallas hasn't as of yet brought either back on the practice squad (Blue is currently on Philadelphia's). Dallas followed up by claiming Emari Demercado off waivers Monday after Kansas City cut him. He lost his spot in KC to rookie Emmett Johnson, and he brings three seasons and 176 touches of NFL experience from Arizona – 126 carries for 819 yards and 3 touchdowns, plus 50 catches for 324 yards and a score. Worth noting: Cowboys offensive coordinator Klayton Adams coached Arizona's line during Demercado's first two seasons, so the playbook adjustment may be shorter than it looks. Even so, Davis is the back to roster behind Javonte Williams, with Demercado the probable No. 3."},{"t":"DAL","x":"Sam Howell opens as the backup quarterback after Joe Milton was waived in the corresponding move for Demercado and re-signed to the practice squad. Howell started in Washington in 2023 and gives Dallas some experience behind Dak Prescott, if little else. In his lone season as a starter he led the league in throwing interceptions (21) and taking sacks (65), so those with key Cowboys hope Prescott remains in the lineup."},{"t":"DAL","x":"In deep dynasty leagues, Camden Brown is a name worth filing. The undrafted rookie made the 53 as a bit of a surprise, but he earned it with 6 catches for 166 yards and 2 touchdowns in the preseason, and he was a genuine deep threat at Georgia Southern last year with 65 catches for 1,079 yards and 14 touchdowns."},{"t":"DEN","x":"J.K. Dobbins had a soft-tissue scare in camp but is on track for Week 1. Denver kept four backs – Dobbins, RJ Harvey, Jonah Coleman, and Tyler Badie. Dobbins should get the bulk of the early-down work, but isn’t much of a threat as a receiver. Harvey is the opposite: an extremely valuable PPR back in the top 40 on the strength of passing-down and red-zone work. Coleman is the wild card. The fifth-round rookie created buzz in camp after gaining more than 1,100 scrimmage yards in three straight college seasons at Arizona and Washington. He didn't get a lot of work in the preseason (7 carries, 33 yards), but looked good with his chances, fighting for extra yards and falling forward; Sean Payton indicated the team had seen what it wanted to see. He'll likely play a lot if Dobbins or Harvey gets hurt. (Badie will play sparingly in occasional passing situations; not a significant factor, with 8 carries and 19 receptions in 16 games a year ago.)"},{"t":"DEN","x":"Marvin Mims left the preseason finale with a foot contusion and sat out practice early in the week. It doesn't sound serious, and he seems to be no better than the No. 4 or 5 receiver, but something to keep in mind for Denver's return teams, as he's a former All-Pro in that capacity."},{"t":"DET","x":"Detroit's backfield depth was already thin after the team traded David Montgomery to Houston, and it got worse when the Lions placed Isiah Pacheco on injured reserve. He'd been dealing with an MCL sprain from early August, and a back injury cropped up while he was working his way back. He'll miss at least four games, and there's reason to wonder about more: Detroit declined to use an IR-to-return designation on him during cutdown day, which would have let them carry an extra player, and the team worked out Kareem Hunt last week without signing him. The Lions did say they expect Pacheco to return this season; Dan Campbell said it's the back, rather than the knee, that's the concern."},{"t":"DET","x":"That leaves Jacob Saylors and Sione Vaki backing up Jahmyr Gibbs. Saylors is a 2023 undrafted free agent out of East Tennessee State who worked primarily on special teams last season, with 2 career carries, and is still expected to be the primary return man. Vaki was a fourth-round pick in 2024 with 7 career carries, and he missed preseason time with a broken nose and back spasms. If something happens to Gibbs, Detroit is in trouble in the short term – but it says something that they still haven't added from outside the building. Saylors is the recommended No. 2, for those looking to protect a Gibbs pick. What's clear is that Gibbs, who signed a three-year extension worth up to $75.5 million last month to become the highest-paid running back in league history, is going to carry an enormous load. He's our No. 1 overall running back, and has been the first pick in most drafts."},{"t":"GB","x":"The Packers are in wait-and-see mode on Josh Jacobs, who was placed on the Commissioner's Exempt List on August 30 and cannot practice or play, though he continues to be paid and can be at the facility for meetings and rehab. He was charged with misdemeanor battery and criminal damage to property stemming from an offseason incident. News came Friday that Jacobs' initial court appearance has been moved up from November 17 to September 10, three days before the opener at Minnesota. That's a faster timeline than anyone expected, but debatable how much it means: Jacobs isn't expected to appear in person, and the NFL is running its own investigation and can discipline him independent of the court's schedule. Any games missed on the exempt list count toward a suspension. GM Brian Gutekunst stopped well short of any guarantee that Jacobs will play this year: \"I think that's to be seen. But I'm certainly hopeful that he will, and would expect that.\" MarShawn Lloyd is next in line. Lloyd is a risky proposition on his own terms: he played in only 1 game as a rookie in 2024 and missed all of last season with a string of soft-tissue leg injuries. But as a third-round pick two years ago, the Packers had high expectations for him. Green Bay also shored things up by trading a sixth-round pick to Pittsburgh for Kaleb Johnson, who opens 3rd on the depth chart behind Lloyd and Chris Brooks. Lloyd looks like the most valuable back in the room for now, while Jacobs' value in drafts is all over the map, with uncertainty over what the evidence against him shows. Our best guess at this point has Jacobs missing something close to half the season, and Lloyd the slightly better fantasy choice, but there's risk in selecting either player too aggressively."},{"t":"GB","x":"Tucker Kraft continues to look good in his return from the ACL tear he suffered last November, and he should play in the opener against Minnesota. Even if he’s on a snap count in the opener, which seems likely, Kraft looks like a strong option. Luke Musgrave is on the reserve/PUP list with a neck injury dating to June minicamp and will miss at least four games, with no timeline beyond that. The Packers signed Jonnu Smith to a one-year deal to fill the gap. He's two years removed from a Pro Bowl season in Miami with 88 catches for 884 yards and 8 touchdowns, but his production collapsed after last year's trade to Pittsburgh with career-low averages of 5.8 yards per reception. He also has history with Matt LaFleur going back to Tennessee in 2017, so the learning curve should be short. He’s only on the radar if Kraft has a setback."},{"t":"HOU","x":"Tank Dell was practicing in camp, making it seem like he'd return soon from 2024's devastating knee injury. But Dell was placed on IR, requiring him to miss at least the first four games, and GM Nick Caserio's words stressed patience. \"He is not quite there. I’d say he’s definitely closer now than he was. There’s a little bit more work that remains.\" It makes Kayshon Boutte look even better, assuming he's up to speed in the offense. Jaylin Noel missed a lot of time in camp with minor injuries, which Xavier Hutchinson remains unproven. Boutte should open in the starting lineup, and he's in a contract year. Possible he draws some motivation from the Patriots dishing him off, indicating he'd have been a game-day inactive in their crowded receiver room. That's not the case in Houston right now, with only Nico Collins proven. Boutte looks like a nice later-round selection."},{"t":"IND","x":"There are injuries to track with the wide receivers. Alec Pierce (ankle) is coming off surgery, while Josh Downs (calf) is dealing with what he calls a very minor issue. There's also Keenan Allen facing DWI charges. The Allen issue doesn't look like a concern; the team says it won't be disciplining him, and any league punishment will likely be delayed, probably until after the season. Both Pierce and Downs have been doing at least individual work in practice. All three should be available for the opener. Pierce seems likeliest to play limited snaps, considering how much time he's missed. Our rankings will probably have Pierce a little lower than he'll be when fully healthy, at least until he shows he's ready for a full workload."},{"t":"IND","x":"Tyler Warren (groin) also has an injury concern, missing some practice time at the end of the preseason. But the tight end is practicing now and expected to be fine for Week 1, and we're ranking him as such."},{"t":"JAX","x":"There are some injury situations to monitor here, but updates are mostly positive. Brian Thomas was dealing with a shoulder issue after landing hard on it in a practice, but Liam Coen says he's a full-go; no issues. Jakobi Meyers jammed his hand or wrist, but Coen says he should be fine for Week 1. Biggest question with these receivers, and Parker Washington, is the ordering: a healthy Thomas was best in 2024, while Washington and Meyers were best the second half of last season. But Coen sounds confident they'll be healthy for Week 1."},{"t":"JAX","x":"One injury certain that sounds less promising is LeQuint Allen. Last year's seventh-rounder was in line for at least some of the passing-downs work, but he's dealing with a soft-tissue injury and Coen was noncommittal about his availability for Week 1. Allen himself doesn't seem likely to be involved enough to be usable, but his absence would likely mean more of those snaps and targets for Bhayshul Tuten. Those who drafted Tuten can bump up expectations a little; he's far more likely to get that receiving work than Chris Rodriguez (6 catches in 35 career games)."},{"t":"KC","x":"Emmett Johnson is one of our favorite late-round targets. The fifth-rounder won the backup running back job over Emari Demercado (who was released) and Brashard Smith (who played behind him in the final exhibition). Smith handled some passing downs chances a year ago, and it's possible he'll be in line for some of those opportunities this year. But the real value in the offense will be which youngster starts if Kenneth Walker should miss time due to injury, and it looks like Johnson will be that player."},{"t":"KC","x":"ADP suggests neither Patrick Mahomes nor Travis Kelce are even being drafted as starters in typical leagues. Mahomes is coming back from knee surgery while Kelce turns 37 next month; it's not surprising there are doubts. We currently have Mahomes just outside the top 10 at the position, a little higher than ADP; Kelce a little lower. With Kelce, there's some sense to selecting him in PPR or TE-premium formats; decent chance he'll be catching a bunch of short passes, although downfield plays will probably be few and far between. He was top-5 a year ago, even with Mahomes missing the last four games. But with both players, there doesn't seem to be much upside. Mahomes will probably be limited early in the season, and is unlikely to run as much as he did a year ago. He doesn't seem to have the line or receiving corps around him to help him approach his previous heights. And Kelce comes off one of his worst seasons for receptions (4.5 per game) and career-worst in yards per game (50). Still a usable player, but unlikely to be much more than a serviceable option. In general, we'll let others select these future Hall of Famers."},{"t":"LV","x":"The Raiders have expressed optimism that Ashton Jeanty (ankle) will play in Week 1. That's not the same as a guarantee, and could potentially be a case of gamesmanship, forcing their opponent (the Dolphins) to prepare for both possible starting running backs. Even presuming he's playing, it will probably be more of a one-two punch than originally planned. Fourth-rounder Mike Washington looked great in the preseason, regularly ripping off good runs. Maybe when Jeanty is 100 percent he'll be merely a change-of-pace (and maybe not), but at least while Jeanty is recovering from the ankle sprain, Washington should get plenty of work. He's a priority pick for anyone who drafted Jeanty, and probably worth selecting a little earlier than a typical backup even for those who didn't. Outside chance he's a starter and workhorse in Week 1, facing what looks like one of the league's lesser teams. Miami has a lot of young players on both sides of the ball, and seemingly one eye on next year's NFL Draft. Jeanty and Washington could both be very good in Week 1 -- and Washington great, if the team decides to hold Jeanty out for a week or two to get him healthy."},{"t":"LV","x":"The Raiders officially named Kirk Cousins the Week 1 starter last week. This was the expectation, now it can be inked in. How long he'll stay there with Fernando Mendoza watching from the sidelines is less clear. Eventually the team will want to get a look at their top pick; how the wins and losses pan out with Cousins will probably determine that. After the Dolphins, Las Vegas will play four of its next six against playoff teams from last year: Chargers, Patriots, Bills and Rams. The other two (New Orleans, Kansas City) won't be easy either. A daunting schedule for a rookie (Mendoza debuting against Myles Garrett and Aaron Donald seems unlikely), but the Raiders starting out 2-5 or so might influence a quarterback switch. The offense should be fine with Cousins, but best guess is that Mendoza will be in the lineup by midseason or so."},{"t":"LAC","x":"Keaton Mitchell has missed a week of practice due to an undisclosed injury. He'd been talked up throughout camp and operated as the clear No. 2 in the exhibition games, climbing our board in the process. Then he suffered what the team has referred to as a minor setback without specifying what the injury is or when he might be available. Doesn’t seem safe to count on, although at some point in drafts he'll fall far enough where his upside becomes worth a dice roll. The Chargers signed him to contract averaging $4.6 million in free agency, so they clearly had a plan in mind. We've had doubts, with Mitchell a smaller player who battled injuries at various points in Baltimore. Just once in three seasons has he carried the ball more than 9 times in a game. At this point, the safest pick to project an Omarion Hampton selection seems to be Kimani Vidal. Vidal isn't as explosive as a healthy Mitchell, but the feeling is the two would play in some sort of tandem should Hampton miss time. Eventually the Chargers will be filing official injury reports which provide more clarity on Mitchell; for now, difficult to predict when he'll get back on the field. Not a player we're recommending at this point."},{"t":"LAC","x":"Charlie Kolar makes some sense as a later-round pick. Perhaps because David Njoku has had the great career, and Oronde Gadsden had the credible rookie campaign (including one outstanding four-game stretch), Kolar is typically viewed as the 3rd-best tight end on his own team; not even drafted in most leagues. But all along the Chargers have treated him as the starter, listing him there on the depth chart, and playing him with the starters in each of the last two exhibitions. This was not a case of multiple tight ends being in the lineup; Kolar is their guy. Whether this translates into a big role in the passing game remains to be seen. Kolar caught just 1 pass in each exhibition. But both were from Justin Herbert, and accounted for 2 of the quarterback's 3 completions in his limited action. Nobody need select Kolar early, but selecting him late makes a lot more sense than using an early pick on either of the other options at the position. Could pay off nicely in TE-friendly formats."},{"t":"LAR","x":"With the season just a few days away -- and the Rams playing on Thursday -- it doesn't seem like a suspension will be happening for Puka Nacua. There were a couple of offseason dramas that made it look possible, but even then probably no more than a game or two, and any league punishment almost certainly would have happened by now. That's not to say Nacua is completely in the clear, but the lean for now is that he can be drafted without concern in that regard. Nacua also missed some practice time in August, but returned to practice last week. He's been working off to the side, but running and making cuts. \"Making good progress,\" according to Sean McVay. It's not certain, but it sounds like he'll be playing in Week 1, and should be fine to select as one of the top 3 or 4 players at the position."},{"t":"MIA","x":"Adding seven players on waivers (all of whom count against the 53-man roster) hints at where this franchise is at right now. There are some talented youngsters, but 13 percent of the roster is composed of players other teams cut a week ago. None of the three quarterbacks currently on the roster, and only one wide receiver and one tight end, have played a regular-season snap for Miami. We have interest in a couple of the young pass catchers, but there will definitely be some growing pains, especially for the passing game. Best to keep expectations low for the offense."},{"t":"MIA","x":"DeVon Achane is the marquee player, probably the only Dolphin that will be selected in the first half of drafts. Defenses will be loading up to stop him, while Miami will be trying to scheme the ball into his hands. It's fair to be concerned that he won't find any running room, but this was a bottom-10 offense a year ago, too, and Achane finished with 1,838 total yards (6th) and 12 touchdown (10th among running backs). There are concerns, but he shouldn't be allowed to slip too far. At least according to the unofficial depth chart, Jaylen Wright will be the backup. A fourth-round pick two years ago, Wright hasn't done much to this point, averaging 69 carries for 269 yards (3.9) his first two seasons. We're not particularly high on him because Ollie Gordon (drafted in the sixth round a year ago) could move up and grab that spot. But it hasn't happened yet, and Gordon's rookie season was forgettable (2.8 yards per carry). But it seems to be Wright's job for now, and he's the correct pick to insure an Achane selection -- though no one should be expecting similar numbers if called upon to start."},{"t":"MIN","x":"It's not certain who the backup quarterback will be. Possibly J.J. McCarthy, but he was banged-up and didn't play in the final preseason game, so maybe Carson Wentz. The team might prefer Wentz in that role, for various reasons. Perhaps they'd like to go back to square one with McCarthy, building his game back up from the ground up, which would be easier with him as the No. 3 than being a Kyler Murray injury away from taking over. Murray, as we've noted previously, has missed at least six games in three of the past four seasons. They also might hope to flip McCarthy for a decent draft pick, and it's debatable whether playing more games at the moment would help or hurt his value. We'll see, but decent chance it's Wentz as the No. 2 for Week 1."},{"t":"MIN","x":"The Vikings Defense looks like one of the better groups. Under Brian Flores, it's ranked in the top 10 in both sacks and takeaways in each of the last two seasons; top-5 in sacks both years. That's despite getting very little help from its bottom-5 offense in as far as playing with leads a year ago. It signed Jamal Adams hoping to add another playmaker; injuries have wrecked the veteran's career, but he was healthy a year ago. But Adams got hurt in the first preseason game, so the defense was looking a little thinner in the secondary. Until Saturday night, when it brought back longtime safety Harrison Smith. Smith is 37 and not the perennial Pro Bowl player he used to be, but in each of the last two years he's been involved in 4 takeaways, and he's been remarkably durable, missing a total of 9 games the last nine years. Defense should be strong again this season."},{"t":"NE","x":"TreVeyon Hendersonis dealing with an ankle injury. He didn't practice on Saturday or for the media portion of Sunday's practice; at this point he's been out of practice for nearly two weeks. New England has the season's earliest kickoff -- Wednesday night in Seattle. Maybe he's back on the field for a walkthrough, but best guess at this point is that Rhamondre Stevenson will not only start but play something close to full-time. New England's other options are Corey Kiner, acquired from the Cardinals at roster cutdown, and a couple of practice squad rookies; seems unlikely they'd be asking much of those players. With no word on the severity of Henderson's injury (presumably a sprain of some kind), makes sense to select Stevenson a little earlier than if Henderson were available, and he'll likely be ranked favorably in Week 1 (despite a tough matchup at the Super Bowl champs). Stevenson always looked like the preferred back in both passing situations and near the goal line, based on the team's usage of these backs late last year, and even more so until Henderson is able to return."},{"t":"NO","x":"Alvin Kamara suffered a sprained MCL in August, which would reportedly sideline him for at least a month. Kamara did, however, avoid being placed on IR at the start of the season, suggesting the team believes he can play at some point during the first four games of the season. New Orleans had placed Devin Neal on IR, but he was released last week, which also could suggest they're expecting to have Kamara available soon. (The Neal transaction was a little surprising, as he had some effective games for the team as a rookie, before hamstring issues ended his season and continued to plague him this preseason.) Kendre Miller and Audric Estime are the other possibilities, and will likely handle backup duties until Kamara is available. Miller is dealing with an undisclosed injury, so it's possible Estime will be the No. 2 early on. Miller hasn't got much traction since being a third-round pick three years ago, averaging just 42 carries in those seasons, battling injuries for most of that. Estime had a big game at Tennessee late last year, but also hasn't shown much as a pro. He caught 4 passes in the preseason, so possible he gets some of those opportunities until Kamara returns. But seems like Travis Etienne should be heavily utilized, probably playing something close to full-time, at least until Kamara is healthy. Even when he is, probably primarily a passing-downs role, with Etienne the main ballcarrier."},{"t":"NO","x":"New Orleans has changed things up at kicker. Last year's starter down the stretch, Charlie Smyth, was released, with Daniel Carlson now the only kicker on the roster. Smyth was added to the practice squad, but Carlson (87 percent accuracy for his career) seems a decent bet to keep the job for the duration."},{"t":"NYG","x":"Malik Nabers (knee) isn't certain to be on the field for Week 1, but that's the expectation. He's been practicing, and has shed the red non-contact jersey, though he didn't play in the preseason. Seems possible he'll get limited snaps early on, but the early-season schedule looks mostly favorable for scoring. Four of New York's first five opponents (Cowboys, Cardinals, Titans and Commanders; Rams are the fifth) ranked 27th or worse in points allowed a year ago."},{"t":"NYG","x":"The backfield is a little uncertain. Cam Skattebo will start, but either Najee Harris or Tyrone Tracy is a possibility as the No. 2. The unofficial depth chart at the team website, in fact, lists both those players and Devin Singletary in the backup slot, not totally surprising with all three veterans who have started at some point in their careers. Only Skattebo looks safe to use, while we're making Harris the slight favorite as the proper No. 2. When he signed, it was reported that he was viewed as \"a significant contributor\" to the offense. He has by far the most experience as an NFL starter, suiting up for every game for the Steelers his first four seasons (before an Achilles injury wiped out most of his year with the Chargers). Tracy was the favorite prior to Harris signing, but it remains to be seen if the team trusts him in pass protection, after a missed blitz pickup got Jaxson Dart clobbered in an exhibition game. One of these backs will probably be a game-day inactive (we're guessing Singletary for now)."},{"t":"NYJ","x":"The Jets seem likely to be one of the worst teams, again, but that doesn't mean there's not some value in the likes of Garrett Wilson and Breece Hall. They were terrible last year (29th in both yards and points), and Wilson was still a top-15 (PPR) wide receiver on a per-game basis, while Hall was top 20 despite scoring only 5 total touchdowns. Geno Smith is a modest veteran (to be kind), but the last time he had much offensive talent around him (as Seattle's starter from 2022-2024) he averaged close to 250 passing yards per game and 24 touchdowns per year. To put that in perspective, the Jets last year averaged 164 passing yards and threw 15 touchdown passes. That's nearly 40 yards per game and 4 fewer touchdowns than Smith threw in Las Vegas last year. Not to make a case for Smith, who carries the risk of being benched for a youngster at some point (fourth-rounder Cade Klubnik will probably make starts late in the year), but he will give the Jets more capable quarterback play than what they got a year ago."},{"t":"NYJ","x":"Adonai Mitchell is basically free in drafts, which is understandable. The Colts gave up on the former second-rounder fairly quickly, and his career catch rate of just 43 percent over his first two seasons is terrible. But lousy quarterbacking can be blamed for some of that, and Mitchell will be a starter in the offense. Eventually he'll be pushed by first-rounder Omar Cooper, but nothing in the preseason made it look like that was imminent. Those in deeper leagues looking for a wideout to toss a later pick at should consider Mitchell, whose two best games to this point came with veteran passers not so different from Smith. With the Colts as a rookie he went 6 for 71 against Buffalo, with Joe Flacco at quarterback, while he had an 8 for 102 with a touchdown game against Atlanta late last season, with Tyrod Taylor in the lineup."},{"t":"NYJ","x":"We wouldn't recommend New York's kicker even if we were sure who would start all 17 games. And we're not sure, with New York kicking a lot of tires at the position: Blake Grupe on the roster, Jason Sanders on the practice squad and Justin Tucker working out for the team last week. Pass."},{"t":"PHI","x":"Makai Lemon was a first-round pick, but we're more interested in selecting Dontayvion Wicks as a depth receiver at this point. A nagging hamstring injury wrecked Lemon's offseason; he's missed a lot of camp. It sounds like he's working his way back and putting the issue behind him, but also that the team is going to be patient and bring him along slowly. Wicks, meanwhile, can play. Green Bay tended to rotate its receivers on and off the field, but in the 16 games the past three seasons where it gave Wicks some work -- 5-plus targets -- he averaged 4 catches for 51 yards, with 8 touchdowns. Philadelphia traded the Packers fifth- and sixth-rounders and signed him to an extension, so a little more than just a depth add. That doesn't quite get Wicks into the territory of a player who should be drafted as a regular starter, but a good use of a later pick. Should be one of the top 3 targets in the passing game while Lemon is getting up to speed, and that's even assuming everyone stays healthy."},{"t":"PIT","x":"If a third wide receiver comes into value here -- and we're not promising one will -- Roman Wilson is the initial favorite. He didn't do much in the preseason (3 for 23 in two contests), but unofficial depths charts indicate he held off second-rounder Germie Bernard, at least for now. Bernard caught 5 for 64 and a touchdown and looked pretty good; he should be a factor here at some point. But playing in all three games while Wilson was among the healthy players who sat one of them is telling. Aaron Rodgers had some encouraging things to say about Wilson, although the praise (\"He's had a fantastic camp, I have the utmost confidence in him\") was notably mixed with criticism (\"He made a repeat mistake, I don't think it's going to happen again\"). The reality that earning favor with his veteran quarterback is always going to be up in the air has us cool on Wilson, besides the fact the offense will run through DK Metcalf and Michael Pittman as long as that duo is healthy. Only if one of them misses time should Wilson be a guy anyone is looking to scoop up, and in dynasty formats, Bernard looks like the better investment. A year ago Pittsburgh didn't even have a usable second wideout, with Calvin Austin (31 catches, 372 yards and 3 TDs) the team's 2nd-best player at the position. But it's a new offense, with Arthur Smith gone and Brian Angelichio in from Minnesota, where the pass game tended to run through it's top 2 wide receivers. Regardless, only Metcalf and Pittman look viable at this point."},{"t":"SF","x":"George Kittle tore his Achilles in January. Initially we dismissed his talk of playing in Week 1, but it now seems pretty clear it's going to happen. The 49ers traveled to Australia for their season-opener last week, and Kittle made the trip. So did their other notable banged-up receiver, Mike Evans. As for how much these players will be on the field in Week 1, that's less certain. Limited to red-zone work is possible (Evans was used in that capacity at times in Tampa Bay). But they should be playing, and then get a mini-bye before their Week 2 game (which looks pretty favorable: home against Miami). Kittle moved up our board fairly steadily over the course of the summer. Risky perhaps to start him in the opener, but once he proves healthy, should be one of the best options. Evans, who was listed at various points in August with groin, quad and adductor injuries, is practicing and seems like he'll be good to go for the start of the season (although it's reasonable to worry about some kind of setback, with him leaving practice due to injury multiple times over the summer). The risk associated with these players makes De'Zhaun Stribling one of our preferred later-round selections, although his performance in the preseason (11 for 109 in two contests) has made him into a popular riser in drafts; may not be available everywhere quite as late as he's ranked, but worth selecting on the upside. He'll open as one of the top 3 wideouts (along with Deebo Samuel), in what should be one of the best offenses."},{"t":"SEA","x":"The popular belief is that Jadarian Price will open as the main back, with George Holani the supporting part of a tandem. How the work will be divvied up isn't certain, but we can make some guesses. Holani played in passing situations in last year's playoffs, after Zach Charbonnet tore his ACL. (Charbonnet is officially on the PUP list to open the season, so he'll be out for at least the first four games.) There's also the possibility that Holani would play some near the goal line, as Charbonnet did in last year's tandem with Kenneth Walker, but that's just speculation. Both backs are listed at 5-foot-11 and 209-210 pounds, so it wouldn’t be based on one being a more logical candidate for goal-line work. Emanuel Wilson could get some chances; at 226 pounds, he's 15 pounds heavier than the others, and has some lead back experience from last year. But Wilson was signed to a minimum-type deal and didn't generate any buzz in the preseason, while dealing with a hamstring injury in August. Price doesn't constitute a safe pick at the position, but pretty likely he opens as one of the top 2 backs, in what will probably be a committee of some sort. When Charbonnet is available, seems most likely it will be the sort of tandem the team employed last year, with Price in the Walker role, and potentially the primary ballcarrier. Holani does make some sense as a late-round selection, in case he winds up with a bigger role than expected."},{"t":"TB","x":"The Bucs aren't overly helpful with discussing injuries, so it's hard to say whether Emeka Egbuka (toe) will be ready for Week 1 or not. Jalen McMillan (knee), either, although Egbuka is the one with the most upside (and is going a lot earlier in drafts). \"They're headed in the right direction,\" said Bowles last week. \"I don't know how fast. We'll have a better gauge next week.\"  Tampa Bay will need to submit its first practice report on Wednesday, at which point it should be a little clear if these players are more or less likely to suit up. Their absence would certainly benefit currently healthy Chris Godwin, and also rookie Ted Hurst. The third-rounder is listed as the direct backup to McMillan in the depth chart at the team website. Egbuka's backup is listed as Kameron Johnson, who's a tougher sell; originally undrafted, he's caught 4 passes the last two seasons. Uncertainty over those starters' availability has us a little more interested in Godwin, and also Hurst as a possible waiver add."},{"t":"TEN","x":"The Titans probably won't have a top-30 wide receiver. On our board, they barely even have one in the top 40. But they do have some talent at the position, giving Cam Ward a puncher's chance of escaping the bottom 10 at the position. Carnell Tate was the 4th overall pick, coming from an Ohio State program that's churned out a lot of successful NFL wideouts lately. Calvin Ridley was also a first-round pick, who has the noteworthy accomplishment of going over 1,000 yards for three different franchises, including the Titans in 2024. Former second-rounder Wan'Dale Robinson caught 92-93 passes for Giants teams that finished outside the top 20 in passing offense the last two years. And then there's a pair of second-year wideouts in Chimere Dike and Elic Ayomanor who started most of last season, providing serviceable if not standout numbers at times. Bottom line: the offense will likely struggle, with a lesser line and a second-year quarterback still finding his way. But let's not rule out there being a viable receiver at some point. Robinson looks like the best bet -- ADP data indicates Tate is being drafted earlier than we'd consider him -- but some chance one or two of these targets exceeds expectations, looking like decent enough late-round choices."},{"t":"WAS","x":"We've had some injury concerns with Jayden Daniels, who started only seven games a year ago (and didn't finish three of them). He's healthy now, but his veteran backup is iffy for the start of the season. Marcus Mariota suffered a sprained MCL in the first preseason game, and was expected to be sidelined for a month. That makes Week 1 an iffy proposition, which would make seventh-round rookie Athan Kaliakmanis the No. 2. The Rutgers product didn't fall on his face in the preseason: 24 of 37 for 294 yards, with no touchdowns or interceptions. He's not much a running threat (under 10 yards per game in college and negative yards in the preseason); nothing close to Daniels or even Mariota. Mentioned primarily as another reason to hope Daniels is able to stay healthy this year, as the offense would likely struggle if forced to rely on its No. 3."}];
const WEEKLY = {"1":{"joe-burrow":{"fbg":[21.4,11.4,32.3],"ath":1},"jalen-hurts":{"fbg":[20.5,10.9,31.3],"ath":4},"lamar-jackson":{"fbg":[20.1,10.7,30.9],"ath":2},"kyler-murray":{"fbg":[19.4,10.3,29.9],"ath":18},"justin-herbert":{"fbg":[18.9,10.1,29.3],"ath":6},"jayden-daniels":{"fbg":[18.4,9.8,28.7],"ath":8},"josh-allen":{"fbg":[18.2,9.7,28.5],"ath":3},"baker-mayfield":{"fbg":[18.2,9.7,28.5],"ath":12},"dak-prescott":{"fbg":[18.1,9.7,28.4],"ath":7},"matthew-stafford":{"fbg":[17.9,9.6,28.2],"ath":13},"jared-goff":{"fbg":[17.8,9.5,28.0],"ath":11},"caleb-williams":{"fbg":[17.7,9.4,27.9],"ath":10},"trevor-lawrence":{"fbg":[17.7,9.4,27.9],"ath":9},"patrick-mahomes":{"fbg":[17.4,9.3,27.5],"ath":19},"drake-maye":{"fbg":[17.3,9.2,27.4],"ath":5},"jaxson-dart":{"fbg":[17.2,9.1,27.2],"ath":14},"daniel-jones":{"fbg":[17.0,9.0,27.0],"ath":23},"bo-nix":{"fbg":[16.9,9.0,27.0],"ath":15},"brock-purdy":{"fbg":[16.9,9.0,26.9],"ath":16},"aaron-rodgers":{"fbg":[16.6,8.8,26.5],"ath":27},"tyler-shough":{"fbg":[16.3,8.7,26.1],"ath":20},"sam-darnold":{"fbg":[16.2,8.6,26.0],"ath":22},"malik-willis":{"fbg":[15.6,8.3,25.4],"ath":17},"cj-stroud":{"fbg":[15.5,8.3,25.3],"ath":25},"bryce-young":{"fbg":[15.5,8.3,25.2],"ath":24},"cam-ward":{"fbg":[15.2,8.1,24.9],"ath":28},"jordan-love":{"fbg":[15.1,8.1,24.7],"ath":21},"fernando-mendoza":{"fbg":[14.8,7.9,24.3]},"jacoby-brissett":{"fbg":[14.4,7.7,23.8],"ath":30},"geno-smith":{"fbg":[14.0,7.5,23.4],"ath":26},"tua-tagovailoa":{"fbg":[13.5,7.2,22.8],"ath":32},"deshaun-watson":{"fbg":[13.3,7.1,22.5],"ath":31},"raheim-sanders":{"fbg":[1.8,1.0,7.3]},"sean-tucker":{"fbg":[1.8,0.9,7.3]},"corey-kiner":{"fbg":[1.7,0.9,7.2]},"kalif-raymond":{"fbg":[1.7,0.9,6.5]},"ty-johnson":{"fbg":[1.6,0.9,7.0]},"isaiah-davis":{"fbg":[1.6,0.8,7.0]},"luke-mccaffrey":{"fbg":[1.5,0.8,6.1]},"eli-raridon":{"fbg":[1.4,0.7,6.1]},"jaylen-wright":{"fbg":[1.4,0.7,6.7]},"ashton-dulin":{"fbg":[1.1,0.6,5.6]},"hollywood-brown":{"fbg":[0.9,0.5,5.2]},"charlie-kolar":{"fbg":[0.9,0.5,5.2]},"elijah-sarratt":{"fbg":[0.9,0.5,5.2]},"antonio-williams":{"fbg":[0.9,0.5,5.2]},"brenen-thompson":{"fbg":[0.7,0.4,5.0]},"demond-claiborne":{"fbg":[0.7,0.4,5.8]},"jake-bates":{"fbg":[10.0,5.3,15.6]},"cameron-dicker":{"fbg":[10.0,5.3,15.6]},"evan-mcpherson":{"fbg":[10.0,5.3,15.6]},"jake-elliott":{"fbg":[9.4,5.0,15.0]},"tyler-loop":{"fbg":[9.4,5.0,15.0]},"harrison-mevis":{"fbg":[9.4,5.0,15.0]},"brandon-aubrey":{"fbg":[9.1,4.9,14.7]},"cairo-santos":{"fbg":[8.7,4.6,14.3]},"cam-little":{"fbg":[8.6,4.6,14.2]},"chase-mclaughlin":{"fbg":[8.6,4.6,14.2]},"jason-myers":{"fbg":[8.6,4.6,14.2]},"will-reichard":{"fbg":[8.5,4.5,14.1]},"tyler-bass":{"fbg":[8.1,4.3,13.7]},"chris-boswell":{"fbg":[8.1,4.3,13.7]},"harrison-butker":{"fbg":[8.1,4.3,13.7]},"blake-grupe":{"fbg":[8.1,4.3,13.7]},"eddy-pineiro":{"fbg":[8.1,4.3,13.7]},"dominic-zvada":{"fbg":[8.1,4.3,13.7]},"trey-smack":{"fbg":[8.0,4.3,13.6]},"ryan-fitzgerald":{"fbg":[7.7,4.1,13.3]},"matt-gay":{"fbg":[7.7,4.1,13.3]},"kaimi-fairbairn":{"fbg":[7.6,4.0,13.2]},"joey-slye":{"fbg":[7.6,4.0,13.2]},"charlie-smyth":{"fbg":[7.6,4.0,13.2]},"andy-borregales":{"fbg":[7.1,3.8,12.7]},"nick-folk":{"fbg":[7.1,3.8,12.7]},"wil-lutz":{"fbg":[7.1,3.8,12.7]},"riley-patterson":{"fbg":[6.6,3.5,12.2]},"chad-ryland":{"fbg":[6.6,3.5,12.2]},"andre-szmyt":{"fbg":[5.7,3.0,11.3]},"raiders-def":{"fbg":[12.4,6.6,19.3]},"chargers-def":{"fbg":[12.2,6.5,19.0]},"jaguars-def":{"fbg":[12.0,6.4,18.8]},"steelers-def":{"fbg":[11.4,6.1,18.1]},"titans-def":{"fbg":[11.2,6.0,17.9]},"chiefs-def":{"fbg":[9.0,4.8,15.3]},"jets-def":{"fbg":[9.0,4.8,15.3]},"seahawks-def":{"fbg":[8.7,4.6,14.9]},"lions-def":{"fbg":[8.4,4.5,14.7]},"rams-def":{"fbg":[8.2,4.4,14.4]},"eagles-def":{"fbg":[8.1,4.3,14.2]},"ravens-def":{"fbg":[8.0,4.3,14.2]},"broncos-def":{"fbg":[8.0,4.3,14.2]},"dolphins-def":{"fbg":[8.0,4.3,14.2]},"bengals-def":{"fbg":[7.8,4.2,13.9]},"cowboys-def":{"fbg":[7.7,4.1,13.8]},"falcons-def":{"fbg":[7.7,4.1,13.8]},"bills-def":{"fbg":[7.6,4.1,13.7]},"browns-def":{"fbg":[7.6,4.1,13.7]},"giants-def":{"fbg":[7.6,4.1,13.7]},"vikings-def":{"fbg":[7.6,4.1,13.7]},"bears-def":{"fbg":[7.5,4.0,13.6]},"packers-def":{"fbg":[7.5,4.0,13.6]},"patriots-def":{"fbg":[7.5,4.0,13.6]},"49ers-def":{"fbg":[7.3,3.9,13.4]},"panthers-def":{"fbg":[7.3,3.9,13.3]},"buccaneers-def":{"fbg":[7.1,3.8,13.1]},"texans-def":{"fbg":[6.9,3.7,12.9]},"commanders-def":{"fbg":[6.4,3.4,12.3]},"saints-def":{"fbg":[6.0,3.2,11.8]},"colts-def":{"fbg":[5.8,3.1,11.6]},"cardinals-def":{"fbg":[5.3,2.8,11.0]},"kirk-cousins":{"ath":29}}}; // week -> player id -> { fbg: [proj, floor, upside], ath: ECR rank }

const DEFS = {"HOU":{"passG":195,"rush":98,"pts":18.9,"sack":3.18,"take":1.65,"vP":1,"vR":1,"vPts":2},"LAR":{"passG":219,"rush":103,"pts":20.4,"sack":3.53,"take":1.59,"vP":6,"vR":3,"vPts":4},"DEN":{"passG":230,"rush":107,"pts":19.8,"sack":3.41,"take":1.35,"vP":15,"vR":4,"vPts":3},"SEA":{"passG":208,"rush":101,"pts":18.5,"sack":2.76,"take":1.35,"vP":2,"vR":2,"vPts":1},"PIT":{"passG":241,"rush":116,"pts":20.4,"sack":2.76,"take":1.47,"vP":23,"vR":12,"vPts":5},"MIN":{"passG":234,"rush":121,"pts":21.2,"sack":2.82,"take":1.44,"vP":16,"vR":20,"vPts":6},"PHI":{"passG":216,"rush":114,"pts":21.3,"sack":2.65,"take":1.44,"vP":4,"vR":10,"vPts":7},"NE":{"passG":228,"rush":119,"pts":21.4,"sack":2.53,"take":1.32,"vP":11,"vR":15,"vPts":8},"BUF":{"passG":211,"rush":122,"pts":21.7,"sack":2.65,"take":1.38,"vP":3,"vR":22,"vPts":10},"JAX":{"passG":237,"rush":112,"pts":22.8,"sack":2.47,"take":1.35,"vP":19,"vR":7,"vPts":18},"BAL":{"passG":249,"rush":108,"pts":21.9,"sack":2.66,"take":1.32,"vP":29,"vR":5,"vPts":11},"CHI":{"passG":244,"rush":131,"pts":22.7,"sack":2.29,"take":1.47,"vP":25,"vR":28,"vPts":15},"NO":{"passG":219,"rush":119,"pts":23.5,"sack":2.65,"take":1.26,"vP":7,"vR":16,"vPts":22},"LAC":{"passG":228,"rush":111,"pts":21.6,"sack":2.65,"take":1.29,"vP":12,"vR":6,"vPts":9},"DET":{"passG":247,"rush":116,"pts":22.1,"sack":2.65,"take":1.24,"vP":27,"vR":13,"vPts":12},"CIN":{"passG":252,"rush":137,"pts":26.1,"sack":2.35,"take":1.35,"vP":30,"vR":31,"vPts":30},"TB":{"passG":257,"rush":119,"pts":22.7,"sack":2.53,"take":1.26,"vP":32,"vR":17,"vPts":16},"NYG":{"passG":227,"rush":133,"pts":23.4,"sack":2.76,"take":1.18,"vP":10,"vR":29,"vPts":21},"TEN":{"passG":221,"rush":119,"pts":24,"sack":2.53,"take":1.15,"vP":9,"vR":18,"vPts":24},"IND":{"passG":246,"rush":117,"pts":23.2,"sack":2.35,"take":1.32,"vP":26,"vR":14,"vPts":19},"GB":{"passG":228,"rush":121,"pts":22.5,"sack":2.41,"take":1.26,"vP":13,"vR":21,"vPts":13},"KC":{"passG":235,"rush":119,"pts":22.5,"sack":2.59,"take":1.15,"vP":17,"vR":19,"vPts":14},"SF":{"passG":239,"rush":112,"pts":23.2,"sack":2.41,"take":1.24,"vP":22,"vR":8,"vPts":20},"DAL":{"passG":248,"rush":114,"pts":23.5,"sack":2.47,"take":1.12,"vP":28,"vR":11,"vPts":23},"CLE":{"passG":235,"rush":122,"pts":24.5,"sack":2.35,"take":1.21,"vP":18,"vR":23,"vPts":25},"WAS":{"passG":242,"rush":129,"pts":25.9,"sack":2.35,"take":1.12,"vP":24,"vR":26,"vPts":29},"CAR":{"passG":217,"rush":113,"pts":22.7,"sack":2.35,"take":1.18,"vP":5,"vR":9,"vPts":17},"ATL":{"passG":220,"rush":129,"pts":25.5,"sack":2.24,"take":1.18,"vP":8,"vR":27,"vPts":27},"LV":{"passG":238,"rush":123,"pts":25.7,"sack":2.29,"take":1.15,"vP":21,"vR":24,"vPts":28},"MIA":{"passG":237,"rush":141,"pts":27.3,"sack":2.18,"take":1.12,"vP":20,"vR":32,"vPts":31},"NYJ":{"passG":228,"rush":124,"pts":25,"sack":2.18,"take":1.03,"vP":14,"vR":25,"vPts":26},"ARI":{"passG":256,"rush":135,"pts":27.5,"sack":2.06,"take":1.21,"vP":31,"vR":30,"vPts":32}};
const LOGO = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAPkAAABkCAMAAABzaWY/AAAA/1BMVEX///8AAAD///////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAbYZ4VAAAAQHRSTlP9AAUwk1HQr28AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAIM09yAAACLBJREFUeNrtnI2y2ygMhWXx+/5PvI7jxDacI4Rz2043ZXZ2emPH4SA+EBJYFlR00VdZ/20U1ebPRwl72b6+fxyO8vwjpRTOz37c8/gsaFee1XlctUt4Vfbxs5pqyVleJe8l1vS4uN4kRFC5fgGUEmvQi3ZdkjQlPmq9VMGlLucvR3JX2p5RZFzi83nr/0LM9K4cw6PWQkwurvJ4yFF7UL1q1rqcvqv0J7d6uir0bMn15ji8cX0gVp7EW+Kbh/Ufea7W9dxqrGPkR1/3VWjDZ703D+8sSpQPG62p2V75AK6hj5FyzUYX5ii0v2Y0YfNUYvMsM9JVidmKiflG8MJa7Yp5dmLu7q5JPsG8HVgixjyavZMNEfOYp20KcFa6yIeYb+XZ3xVibvTjQ7kxvuVtXkvOavjmgGeByuuc8roQnre6hEGL2b84AObcRu6R0FBeZL67g18tA/AOz0PNVnXP5lM1/xzzfV6ex7yojvGawnwJ8pnycEv5NOblwJwP3RvmwTva1A+VT2K+TyeKMVcZKbeU+TEvc509yw9gvk+505jXt/LyA5hXjGkuW+mtJcCBA32vvAubnRjmWkfKTYwJ5rl2Bbdy3YFKDk8G9b18XE5wyoV+32iR9VZeB3N0AL0Mzkmo8ffSPVhcmMfTYrkQFqcx3x0ZtcY3hrkqWsb3D3o71qmzpbgwPznYoPdWC/MwVG55HwTzjOIloJWPMTSOVyxorXk4W9AAAfMcR8PyS3mxbwGmjFh5D/M7KJQ7W4oH82JGH7Z2AZ8PYym66Mh7oJirC/PwGklC/2DxYH6JGuWfwvylPMoA82T0wcuklNHQC3tDATEZVJNgrqMr5jmPMJc9tDiao/sKZfVhHqnDUJHy3qjZDDLuvXoe830yrKMV933MucMQeuXISvGMefwxzJm3fxvzSga4XnkBsVdmVD7AMcwDttcMDplgHjDmhZvsEvAPYQHxdmZUvoCNBHMd6YpDlzwyzKEDB2J1wciTiAPzs8nDHOZpFEnQ8UooG5PsKKoQjtjHxd3rlQ8xr3OYx3Zp2Cqv/DpdrlSsPLAx0mXzecyfvRrnGNoOlEu3msjXFSF4NMC8s5+xyK8L6fEyhTmZYSjmjb1iaVv0Kqv6cgzaAm6GNwpJisoQ8+LB3BeVSJ3yywc5uZYrRbHN2TyScY+X4TBxSX4lgrkv+KiN8qYhU70RfMw5p33lE7krCMwuc5hDR1LB+BvAsJyvytdZNV7nkPZ2ZwD9pdyI5oEeL8NUopoD3EzwMV6ltder3gw+6stJ5b5B7md2GaUSL7O5zkUlWsxb5VdV6sNc2PrFXvx0sMsI82gPcGEC83BRnpvRtPa3+3IMcTi8Q9hlCvMKHEnoZgVgr0Zqbn6sm1YGSTkwBK+3G+uEBnbxr81nlisI83L9IF+fFpe7mF9qqMXC4ixdxmtzKx4zE3ysV21FG5On2QUNCNDoYoV4LuOcDDAvH2DeT88XZbHRGcGQpOO9Etc47GAePEmXAeYuP6b4MG9s3pi8fYoX8zZAY8KeD6dPZjCPc5jn5l5joH6s28S1XBkHaMxdYUcflkGOQc3tSyT4SDA3lIdOpHtLVO+jrH/X8e0ygbkSzH3Bx2AoL73IzZQezMFqRI0eH6Hyn8IcRSWy5ZaE3icIGPNuEyqMRhrTWwYjHEsc3cJ86THnysG1THbeqMI1KpIe7UlQ/JgvXswzapBqOJd9jGJv1DgMRFHtyrygXvkNzGeCj4Er36aaCBoVxLi8NuewI+W/FnOuPIEwF1mukMgSbg/oCAHO5zF/ek8gXQ/sVbhfspm8xxx5YxkbmfZ4Ky8sixlXNTHnwUdFmPPoqHoxj0SkPg9JPE82hDCqdDfC3cM8eTFnypVhjnfeeFKJh8X4I2QZ5Ifng48wx8C9cLgmI5jjhNqSqXeOUWyVT2Ouxs7HRoqxZwaxIST4iAY4M28e+MpO7PTJGHP1Yk6UQza2htLoTKgl1qMJilflaAaItzCH5g1UeVDABgk+koRaYV2D75y5KA92CC59FJVQllndt0n7MCc+Op371MD8pLzaK9T4SfBx11eZySHmwYl54JirwYvY0UUD88IwX7DTDpXve2WSK/iYvZtE3knzZPAiHPN6dgfDXI4BYA6VJ3iBBB8j3PJpYV7GcTgWXXyVgNfUYOcjxRyH6+EuyMQwd22VyMu7VawEtNARLB8NGypZ8ziDj2UhZ+h2CpyYp8sun7AfwoXHA5+iTIDFOg+7hz14NMEZlYhE+dNh6Cqf3ecYHsE9MHg8N7yDQ7kJxNt15lTibPAxEeUVf+7OMfSZ6Ilopdw8rsSCj3DcU6JcOebqMkWeO6eVzyEcuXcq8TnDUMwjmo2gbScwJ2H6PNdPO+VxUnmaiEqwc6tB4V6H7D9YmxbVm539pXwW86x4azoc9xLe0xCNruA0RZiqeemzyPNn8wLZpxw55p3yoHiThzeVuM8NZa7SrfJ6q6/7ohIFu1THCcWPMPePUBXsmZg9m/fqvgTzxscnB/LYSYtJzN2glyY2L+YmOtzH+OkQC/NG+XHS4j7m6nd5tuzM0iufwbyqHfFgmDfKE1tW+N+u8PL6Pa0Uu6yEzGGeq552mkZP0iUf95c+0kVmc3Vi/swyRE83RfvhvJjnmM6vzpnE/HqhsiDh8Hwf6jbBFBAT2/25Wql7QdCrxL3UFLTJ4K0L/3VdcHl90X4A7fJOo/M+m9Onb8w1NbdvhkyOcnpZw/qFWHK/4OpfdETPNNgviVId3LH8maJqpNdIvlXgV3AZJvJ0YUcn+gujbOBkhaz6+c6x/NXFn2L+vymfKv+U/1P+Xcr1O8o/m7+Vr67Vd5SlXatNR6L+0tLusZEbAee/s6ReefoO5dorj18hvEtBy7divo5w4TsxX21evxPz1eblOzDvfbgvmdP6HbOSvhTzRb5jTgM7Zr9DN9oYL/EPlbL997tKHb1z4HdGC//0KvU/OKxNAtY81/cAAAAASUVORK5CYII=";
const POOL_BY_ID = Object.fromEntries(POOL.map((p) => [p.id, p]));
const WEB = typeof window !== "undefined" && !!window.__DIMES_WEB__;
const DEFAULT_API = "https://dimes-war-room.vercel.app";
function getStore() {
  if (typeof window === "undefined") return null;
  if (window.storage) return window.storage;
  try { const ls = window.localStorage; return { get: async (k) => { const v = ls.getItem(k); if (v == null) throw new Error("nf"); return { key: k, value: v }; }, set: async (k, v) => { ls.setItem(k, v); return { key: k, value: v }; } }; } catch (e) { return null; }
}
function normName(n) { return n.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/['.]/g, "").replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "").replace(/[^a-z0-9]+/g, ""); }
let VEGAS = null; // set from state on each render
function vegasProp(p) { if (!VEGAS || !VEGAS.props || !p) return null; return VEGAS.props[normName(p.n)] || null; }
function vegasPts(p) {
  const pr = vegasProp(p); if (!pr) return null;
  if (pr.pass_yds == null && pr.rush_yds == null && pr.rec_yds == null && pr.rec == null) return null;
  const lam = pr.atd != null ? -Math.log(1 - Math.min(0.95, pr.atd)) : 0;
  const pts = (pr.pass_yds || 0) / 25 + (pr.pass_tds || 0) * 4 - (p.p === "QB" ? 0.6 : 0) + (pr.rush_yds || 0) / 10 + (pr.rec_yds || 0) / 10 + (pr.rec || 0) * 0.5 + lam * 6;
  return Math.round(pts * 10) / 10;
}
function vegasGame(team) { if (!VEGAS || !VEGAS.games) return null; return VEGAS.games.find((g) => g.home === team || g.away === team) || null; }
function vegasFresh(week) { return !!(VEGAS && VEGAS.week === week && VEGAS.games && VEGAS.games.length); }
function vegasUsed(p, week) { return vegasFresh(week) && vegasPts(p) != null; }
const TEAMS = ["ARI","ATL","BAL","BUF","CAR","CHI","CIN","CLE","DAL","DEN","DET","GB","HOU","IND","JAX","KC","LAC","LAR","LV","MIA","MIN","NE","NO","NYG","NYJ","PHI","PIT","SEA","SF","TB","TEN","WAS"];
const TEAM_PAL = { ARI:["#97233F","#FFB612"], ATL:["#A71930","#000000"], BAL:["#241773","#9E7C0C"], BUF:["#00338D","#C60C30"], CAR:["#0085CA","#101820"], CHI:["#0B162A","#C83803"], CIN:["#FB4F14","#000000"], CLE:["#311D00","#FF3C00"], DAL:["#003594","#869397"], DEN:["#FB4F14","#002244"], DET:["#0076B6","#B0B7BC"], GB:["#203731","#FFB612"], HOU:["#03202F","#A71930"], IND:["#002C5F","#A2AAAD"], JAX:["#006778","#D7A22A"], KC:["#E31837","#FFB81C"], LAC:["#0080C6","#FFC20E"], LAR:["#003594","#FFA300"], LV:["#000000","#A5ACAF"], MIA:["#008E97","#FC4C02"], MIN:["#4F2683","#FFC62F"], NE:["#002244","#C60C30"], NO:["#D3BC8D","#101820"], NYG:["#0B2265","#A71930"], NYJ:["#125740","#FFFFFF"], PHI:["#004C54","#A5ACAF"], PIT:["#FFB612","#101820"], SEA:["#002244","#69BE28"], SF:["#AA0000","#B3995D"], TB:["#D50A0A","#FF7900"], TEN:["#0C2340","#4B92DB"], WAS:["#5A1414","#FFB612"] };
function lum(hex) { const n = parseInt(hex.slice(1), 16); const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(n >> 16) + 0.7152 * f((n >> 8) & 255) + 0.0722 * f(n & 255); }
function contrast(a, b) { const la = lum(a), lb = lum(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); }
const TEAM_STYLE = {};
Object.keys(TEAM_PAL).forEach((t) => { const [a, b] = TEAM_PAL[t]; const dark = lum(a) <= lum(b) ? a : b, light = dark === a ? b : a; TEAM_STYLE[t] = { bg: dark, line: light, text: contrast(light, dark) >= 2.4 ? light : "#FFFFFF" }; });
const TEAM_COLOR = Object.fromEntries(Object.keys(TEAM_PAL).map((t) => [t, TEAM_STYLE[t].bg]));
const TEAM_BYE = {};
TEAMS.forEach((t) => { for (let w = 5; w <= 14; w++) { if (!NFL[w][t]) { TEAM_BYE[t] = w; break; } } });

const ME = "Donnie Dimes";
const LEAGUE_TEAMS = Object.keys(TEAMS_INIT);
const SLOTS = [
  { k: "QB", label: "QB", elig: ["QB"] }, { k: "RB1", label: "RB", elig: ["RB"] }, { k: "RB2", label: "RB", elig: ["RB"] },
  { k: "WR1", label: "WR", elig: ["WR"] }, { k: "WR2", label: "WR", elig: ["WR"] }, { k: "TE", label: "TE", elig: ["TE"] },
  { k: "FLEX1", label: "FLEX", elig: ["RB", "WR", "TE"] }, { k: "FLEX2", label: "FLEX", elig: ["RB", "WR", "TE"] },
  { k: "K", label: "K", elig: ["K"] }, { k: "DEF", label: "DEF", elig: ["DEF"] },
];
const MY_SCHEDULE = { 1: "Spictaculous", 2: "The Fun Brunch", 3: "What Would Breesus Do", 4: "Brafferton Beast II", 5: "The Manglers", 6: "Nothing Else Matters", 7: "2 Cups of Rice", 8: "SOULTRAIN", 9: "Team Riggo", 10: "USC_Nemo", 11: "Knappachino", 12: "Underdog", 13: "BIG DADDY", 14: "Spictaculous", 15: "Playoffs, round 1", 16: "Playoffs, round 2", 17: "Championship" };
const RIVALRY_WEEK = 10, REG_WEEKS = 14, MAX_WEEK = 17, NEUTRAL_WEEK = 12, IR_LIMIT = 2;
const STORAGE_KEY = "dimes:hogg-heaven-2026";
const SEASON_START = new Date(2026, 8, 8);
const POS_LIST = ["QB", "RB", "WR", "TE", "K", "DEF"];
const POS_ORDER = { QB: 0, RB: 1, WR: 2, TE: 3, K: 4, DEF: 5 };
const HYPE = ["Let's go dominate", "All in", "Road warriors", "Ring number two", "Dimes on dimes", "Nobody is safe", "Pay the man", "Built different", "Championship or nothing", "Lock it in", "Talk is cheap, points are not", "Bench mob activated", "Wire wizard", "Run it back", "Dynasty in progress", "Trust the dimes"];
const STATUS = { ok: { label: "Healthy", short: "" }, q: { label: "Questionable", short: "Q" }, d: { label: "Doubtful", short: "D" }, o: { label: "Out", short: "OUT" }, ir: { label: "IR", short: "IR" } };
const FLAG_TEXT = { g: "injured (FBG)", P: "rookie", Q: "high upside", h: "suspended", X: "concussion history" };
// League transactions since the draft (Yahoo, Sept 7)
const TRANSACTIONS = [
  { t: "Sep 7", team: "Nothing Else Matters", add: "cowboys-def", drop: null },
  { t: "Sep 7", team: "2 Cups of Rice", add: "demond-claiborne", drop: "greg-dulcich" },
  { t: "Sep 7", team: ME, add: "raiders-def", drop: null },
  { t: "Sep 7", team: ME, add: "jake-bates", drop: "eddy-pineiro" },
  { t: "Sep 7", team: "SOULTRAIN", add: "tank-dell", drop: "cyrus-allen" },
  { t: "Sep 7", team: "SOULTRAIN", add: "samaje-perine", drop: null },
  { t: "Sep 7", team: "What Would Breesus Do", add: "titans-def", drop: "terrance-ferguson" },
];
const txKey = (t, act, id, team) => `${t}|${act}|${id}|${team}`;

// =============================================================================
// HELPERS
// =============================================================================
const currentWeek = () => Math.min(Math.max(Math.floor((Date.now() - SEASON_START.getTime()) / (7 * 864e5)) + 1, 1), MAX_WEEK);
const weekSunday = (w) => new Date(SEASON_START.getTime() + ((w - 1) * 7 + 5) * 864e5).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const today = () => new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
const slug = (s) => s.toLowerCase().replace(/['.]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const fmt1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const signed = (x) => (x >= 0 ? "+" : "") + fmt1(x);
function matchup(team, week) { const g = NFL[week] && NFL[week][team]; if (!g) return { text: "BYE", bye: true }; return { text: (g.h ? "vs " : "@ ") + g.o, bye: false, opp: g.o, home: !!g.h }; }
function lastName(n) { const parts = n.split(" ").filter((x) => !/^(Jr\.?|Sr\.?|II|III|IV|V)$/.test(x)); return parts[parts.length - 1] || n; }
const hasProj = (p) => p && p.pw != null;
const srcList = (p) => [p.pwF != null && "FI", p.pwB != null && "FBG", p.pwP != null && "PFF"].filter(Boolean);
const pw = (p) => (hasProj(p) ? p.pw : 1.0);
const wkBase = (p) => (p && p.wk != null ? p.wk : 1.0);
const CURVES = {};
function curve(pos, week) {
  const key = pos + week; if (CURVES[key]) return CURVES[key];
  const wk = WEEKLY[week] || {}; const fb = Object.keys(wk).map((id) => POOL_BY_ID[id]).filter((p) => p && p.p === pos && wk[p.id].fbg).map((p) => wk[p.id].fbg[0]).sort((a, b) => b - a);
  const c = fb.length >= 12 ? fb : POOL.filter((p) => p.p === pos && p.wk != null).map((p) => p.wk).sort((a, b) => b - a);
  CURVES[key] = c; return c;
}
function rankPts(pos, rank, week) { const c = curve(pos, week); if (!c.length) return null; if (rank <= c.length) return c[rank - 1]; return Math.max(0.5, c[c.length - 1] * Math.pow(0.92, rank - c.length)); }
function weekly(p, week) { const w = WEEKLY[week]; return w && p ? w[p.id] || null : null; }
// This-week components, each with a weight. Returns { v, parts:[{k,label,v,w}] }
function wkBreakdown(p, week) {
  const parts = [];
  if (hasProj(p)) parts.push({ k: "model", label: "Season model", v: wkBase(p) * mxAdj(p, week), w: 1 });
  const wk = weekly(p, week);
  if (wk && wk.fbg) parts.push({ k: "fbg", label: `Footballguys wk ${week}`, v: wk.fbg[0], w: 1.2, floor: wk.fbg[1], up: wk.fbg[2] });
  if (wk && wk.ath != null) { const v = rankPts(p.p, wk.ath, week); if (v != null) parts.push({ k: "ath", label: `Athletic ECR #${wk.ath}`, v, w: 0.7 }); }
  if (vegasFresh(week)) { const v = vegasPts(p); if (v != null) parts.push({ k: "vegas", label: "Vegas implied", v, w: 1.5 }); }
  if (!parts.length) return { v: 1.0, parts };
  const W = parts.reduce((a, x) => a + x.w, 0);
  return { v: parts.reduce((a, x) => a + x.v * x.w, 0) / W, parts };
}
function wkPts(p, week) {
  if (!p) return 0; if (matchup(p.t, week).bye) return 0; if (p.status === "o" || p.status === "ir" || p.status === "d") return 0;
  return wkBreakdown(p, week).v;
}
const seasonPts = (p) => (!p || p.status === "ir" ? 0 : pw(p));
// Matchup difficulty: 1 = toughest defense, 32 = softest (FFI projected yards/points allowed)
function mxRank(p, week) {
  const m = matchup(p.t, week); if (m.bye || !DEFS[m.opp]) return null;
  const d = DEFS[m.opp];
  if (p.p === "RB") return d.vR; if (p.p === "QB" || p.p === "WR" || p.p === "TE") return d.vP; if (p.p === "K") return d.vPts; return null;
}
function mxAdj(p, week) { const r = mxRank(p, week); return r == null ? 1 : 1 + ((r - 16.5) / 15.5) * 0.1; }
function mxLabel(p) { return p.p === "RB" ? "vs run" : p.p === "K" ? "pts allowed" : "vs pass"; }
function sosColor(r) { if (r == null) return "var(--surface3)"; const h = ((r - 1) / 31) * 120; return `hsl(${h} 58% 42%)`; }
function ordinal(n) { const s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
function bestLineup(players, week, season) {
  const val = season ? seasonPts : (p) => wkPts(p, week);
  const avail = players.filter((p) => val(p) > 0).sort((a, b) => val(b) - val(a));
  const used = new Set(); const L = {};
  SLOTS.forEach((s) => { const p = avail.find((x) => !used.has(x.id) && s.elig.includes(x.p)); L[s.k] = p ? p.id : null; if (p) used.add(p.id); });
  return L;
}
function lineupTotal(L, byId, week, season) { const val = season ? seasonPts : (p) => wkPts(p, week); return SLOTS.reduce((t, s) => t + (L[s.k] && byId[L[s.k]] ? val(byId[L[s.k]]) : 0), 0); }
function sanitizeLineup(L, byId) { if (!L) return null; const out = {}; SLOTS.forEach((s) => { const p = L[s.k] ? byId[L[s.k]] : null; out[s.k] = p && p.status !== "ir" && s.elig.includes(p.p) ? p.id : null; }); return out; }
function teamStrength(ids) { const players = ids.map((id) => POOL_BY_ID[id]).filter(Boolean); const byId = Object.fromEntries(players.map((p) => [p.id, p])); const L = bestLineup(players, NEUTRAL_WEEK, true); return { total: lineupTotal(L, byId, NEUTRAL_WEEK, true), L, players, byId }; }
function sortRoster(r) { return [...r].sort((a, b) => POS_ORDER[a.p] - POS_ORDER[b.p] || pw(b) - pw(a)); }
function recordFromResults(results) {
  let w = 0, l = 0, t = 0, pf = 0, pa = 0; const seq = [];
  for (let k = 1; k <= MAX_WEEK; k++) { const r = results[k]; if (!r) continue; const my = parseFloat(r.my), op = parseFloat(r.opp); if (isNaN(my) || isNaN(op)) continue; pf += my; pa += op; if (my > op) { w++; seq.push("W"); } else if (my < op) { l++; seq.push("L"); } else { t++; seq.push("T"); } }
  let streak = ""; if (seq.length) { const last = seq[seq.length - 1]; let n = 0; for (let i = seq.length - 1; i >= 0 && seq[i] === last; i--) n++; streak = `${last}${n}`; }
  return { w, l, t, pf, pa, games: seq.length, streak, seq };
}
const fmtRecord = (rec) => (rec.t ? `${rec.w}-${rec.l}-${rec.t}` : `${rec.w}-${rec.l}`);
function weekResult(results, w) { const r = results[w]; if (!r) return ""; const my = parseFloat(r.my), op = parseFloat(r.opp); if (isNaN(my) || isNaN(op)) return ""; return my > op ? "W" : my < op ? "L" : "T"; }
function newsFor(p) {
  if (!p) return [];
  if (p.p === "DEF") return NEWS.filter((n) => n.t === p.t && /defen|pass rush|takeaway|sack/i.test(n.x)).slice(0, 2);
  const ln = lastName(p.n); const re = new RegExp("(^|[^A-Za-z])" + ln.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "([^A-Za-z]|$)");
  return NEWS.filter((n) => n.t === p.t && re.test(n.x));
}
function applyTransactions(s) {
  let ns = { ...s, roster: [...s.roster], teams: { ...s.teams }, log: [...s.log], txSeen: [...(s.txSeen || [])] };
  TRANSACTIONS.forEach((tx) => {
    const kAdd = txKey(tx.t, "add", tx.add, tx.team), kDrop = tx.drop ? txKey(tx.t, "drop", tx.drop, tx.team) : null;
    if (ns.txSeen.includes(kAdd)) return;
    const add = POOL_BY_ID[tx.add]; const drop = tx.drop ? POOL_BY_ID[tx.drop] : null;
    const strip = (id) => { ns.roster = ns.roster.filter((p) => p.id !== id); Object.keys(ns.teams).forEach((t) => { ns.teams[t] = ns.teams[t].filter((x) => x !== id); }); };
    if (tx.drop) strip(tx.drop);
    if (add) { strip(add.id); if (tx.team === ME) ns.roster.push({ ...add, status: "ok", note: "", via: "Free agent" }); else ns.teams[tx.team] = [...(ns.teams[tx.team] || []), add.id]; }
    ns.txSeen.push(kAdd); if (kDrop) ns.txSeen.push(kDrop);
    ns.log = [{ t: tx.t, text: `${tx.team === ME ? "Added" : tx.team + " added"} ${add ? add.n : tx.add}${drop ? `, dropped ${drop.n}` : ""}.` }, ...ns.log];
  });
  return ns;
}
function freshState() {
  const teams = {}; LEAGUE_TEAMS.forEach((t) => { if (t !== ME) teams[t] = [...TEAMS_INIT[t].r]; });
  const base = { v: 3, roster: TEAMS_INIT[ME].r.map((id) => ({ ...POOL_BY_ID[id], status: "ok", note: "", via: "Draft" })), teams, lineups: {}, results: {}, watch: [], log: [{ t: "Sep 5", text: "Drafted 16 players from the 9 seat." }], notes: "", chat: [], settings: { theme: "auto", rosterLimit: 17 }, txSeen: [] };
  return applyTransactions(base);
}
function migrate(s) {
  const fresh = freshState();
  let out = { ...fresh, ...s, settings: { ...fresh.settings, ...(s.settings || {}) } };
  out.roster = (s.roster || fresh.roster).map((r) => ({ ...r, ...(POOL_BY_ID[r.id] || {}), status: r.status || "ok", note: r.note || "", via: r.via || "Draft" }));
  if (!s.teams) out.teams = fresh.teams;
  out.watch = (s.watch || []).map((w) => ({ ...w, ...(POOL_BY_ID[w.id] || {}), note: w.note || "" }));
  out.txSeen = s.txSeen || (s.v && s.v >= 3 ? TRANSACTIONS.slice(0, 4).flatMap((tx) => [txKey(tx.t, "add", tx.add, tx.team), tx.drop ? txKey(tx.t, "drop", tx.drop, tx.team) : null].filter(Boolean)) : []);
  out = applyTransactions(out);
  out.v = 3;
  return out;
}
const REDUCE = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function useTween(target, ms = 480) {
  const [v, setV] = useState(target); const ref = useRef(target);
  useEffect(() => {
    const from = ref.current, to = target; if (from === to) return;
    if (REDUCE || typeof requestAnimationFrame === "undefined") { ref.current = to; setV(to); return; }
    const t0 = performance.now(); let raf;
    const step = (t) => { const k = Math.min(1, (t - t0) / ms); const e = 1 - Math.pow(1 - k, 3); setV(from + (to - from) * e); if (k < 1) raf = requestAnimationFrame(step); else ref.current = to; };
    raf = requestAnimationFrame(step); return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}
// ---- Yahoo transactions paste parser ----
const YT = { ari:"ARI", atl:"ATL", bal:"BAL", buf:"BUF", car:"CAR", chi:"CHI", cin:"CIN", cle:"CLE", dal:"DAL", den:"DEN", det:"DET", gb:"GB", hou:"HOU", ind:"IND", jax:"JAX", jac:"JAX", kc:"KC", lac:"LAC", lar:"LAR", lv:"LV", mia:"MIA", min:"MIN", ne:"NE", no:"NO", nyg:"NYG", nyj:"NYJ", phi:"PHI", pit:"PIT", sea:"SEA", sf:"SF", tb:"TB", ten:"TEN", was:"WAS", wsh:"WAS" };
const DEF_NAMES = { ARI:"Cardinals", ATL:"Falcons", BAL:"Ravens", BUF:"Bills", CAR:"Panthers", CHI:"Bears", CIN:"Bengals", CLE:"Browns", DAL:"Cowboys", DEN:"Broncos", DET:"Lions", GB:"Packers", HOU:"Texans", IND:"Colts", JAX:"Jaguars", KC:"Chiefs", LAC:"Chargers", LAR:"Rams", LV:"Raiders", MIA:"Dolphins", MIN:"Vikings", NE:"Patriots", NO:"Saints", NYG:"Giants", NYJ:"Jets", PHI:"Eagles", PIT:"Steelers", SEA:"Seahawks", SF:"49ers", TB:"Buccaneers", TEN:"Titans", WAS:"Commanders" };
const ADD_WORDS = /^(free agents?|waivers?|waiver claim|added|add|from waivers|from free agents)$/i;
const DROP_WORDS = /^(to waivers|to free agents|dropped|drop|released)$/i;
const TRADE_WORDS = /^(trade|traded|trade accepted|from trade)$/i;
const DATE_RE = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(,\s*\d{4})?(,?\s+\d{1,2}:\d{2}\s*(am|pm))?$/i;
const PLAYER_RE = /^(.+?)\s+([A-Za-z]{2,3})\s*[-–]\s*(QB|RB|WR|TE|K|DEF|D\/ST|DST)\b.*$/;
function findPlayer(name, team, pos) {
  if (pos === "DEF") { const p = POOL.find((x) => x.p === "DEF" && x.t === team); if (p) return p; }
  const k = normName(name);
  let p = POOL.find((x) => x.p === pos && normName(x.n) === k);
  if (!p) p = POOL.find((x) => x.p === pos && x.t === team && lastName(x.n).toLowerCase() === lastName(name).toLowerCase() && normName(x.n)[0] === k[0]);
  if (!p) { const id = slug(name) + "-" + pos.toLowerCase(); p = { id, n: name, p: pos, t: team, b: TEAM_BYE[team] || null, a: 300, custom: true }; }
  return p;
}
function parseYahooTx(text) {
  const lines = text.split(/\r?\n/).map((l) => l.replace(/\u00a0/g, " ").trim()).filter(Boolean);
  const teamLower = LEAGUE_TEAMS.map((t) => [t.toLowerCase(), t]);
  const moves = []; let block = { players: [], teams: [], pending: null };
  const finish = (date) => {
    const tnames = block.teams; const pls = block.players;
    if (pls.length) {
      const isTrade = tnames.length >= 2 || pls.some((p) => p.act === "trade");
      pls.forEach((p) => {
        let team = tnames[0] || ""; let act = p.act;
        if (isTrade) { act = "trade"; team = p.to || ""; }
        moves.push({ key: `${date}|${act}|${p.player.id}|${team}`, date, act: act || "add", player: p.player, team, teams: tnames });
      });
    }
    block = { players: [], teams: [], pending: null };
  };
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (DATE_RE.test(ln)) { finish(ln.replace(/,?\s+\d{1,2}:\d{2}\s*(am|pm)$/i, "")); continue; }
    if (/^[+＋]$/.test(ln)) { block.pending = "add"; continue; }
    if (/^[-−–—]$/.test(ln)) { block.pending = "drop"; continue; }
    const tl = ln.toLowerCase(); const tm = teamLower.find(([l]) => l === tl);
    if (tm) { if (!block.teams.includes(tm[1])) block.teams.push(tm[1]); if (block.players.length && !block.players[block.players.length - 1].to && block.players[block.players.length - 1].awaitTeam) block.players[block.players.length - 1].to = tm[1]; continue; }
    const pm = ln.match(PLAYER_RE);
    if (pm) {
      const name = pm[1].replace(/\s*[+−–-]\s*$/, "").trim(); const team = YT[pm[2].toLowerCase()] || pm[2].toUpperCase(); const pos = /D\/ST|DST/i.test(pm[3]) ? "DEF" : pm[3].toUpperCase();
      const entry = { player: findPlayer(name, team, pos), act: block.pending || null, to: null, awaitTeam: false };
      block.pending = null;
      const nx = (lines[i + 1] || "");
      if (ADD_WORDS.test(nx)) { entry.act = entry.act || "add"; i++; }
      else if (DROP_WORDS.test(nx)) { entry.act = entry.act || "drop"; i++; }
      else if (TRADE_WORDS.test(nx) || /^traded to\b/i.test(nx) || /^to\s+/i.test(nx)) { entry.act = "trade"; const m2 = nx.match(/^(?:traded )?to\s+(.+)$/i); if (m2) { const t2 = teamLower.find(([l]) => l === m2[1].toLowerCase()); if (t2) entry.to = t2[1]; else entry.awaitTeam = true; } else entry.awaitTeam = true; i++; }
      block.players.push(entry); continue;
    }
    if (ADD_WORDS.test(ln) && block.players.length) { block.players[block.players.length - 1].act = block.players[block.players.length - 1].act || "add"; continue; }
    if (DROP_WORDS.test(ln) && block.players.length) { block.players[block.players.length - 1].act = block.players[block.players.length - 1].act || "drop"; continue; }
  }
  finish("");
  return moves;
}
function renderMd(text) {
  const lines = text.split(/\r?\n/); const out = []; let list = null;
  const inline = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
  lines.forEach((ln, i) => {
    const m = ln.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
    if (m) { if (!list) list = []; list.push(<li key={i}>{inline(m[1])}</li>); return; }
    if (list) { out.push(<ul key={"l" + i}>{list}</ul>); list = null; }
    if (!ln.trim()) return;
    const h = ln.match(/^#{1,4}\s+(.*)$/); if (h) { out.push(<p key={i} className="md-h">{inline(h[1])}</p>); return; }
    out.push(<p key={i}>{inline(ln)}</p>);
  });
  if (list) out.push(<ul key="lend">{list}</ul>);
  return out;
}

// =============================================================================
// DESIGN SYSTEM
//   The coach's laminated call sheet: paper, thick ink, highlighter for
//   attention, tabular condensed numerals. Dark variant for night games.
// =============================================================================
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,62..125,100..900&display=swap');
.dd{--navy:#0B2265;--navy2:#153A8F;--navy3:#0A1B4F;--red:#A71930;--red2:#C8233F;--bg:#EDF0F6;--surface:#FFFFFF;--surface2:#F2F4F9;--surface3:#E6EAF3;--ink:#0E1A38;--ink2:#5A657D;--ink3:#97A0B5;--rule:#E1E5EE;--rule2:#C9D0DF;--pri:#0B2265;--pri-ink:#FFFFFF;--go:#178A4C;--go-bg:#E1F4E8;--stop:#A71930;--stop-bg:#FBE7EB;--warn:#B05A00;--warn-bg:#FFF0DA;--info:#153A8F;--info-bg:#E6ECFA;--shadow:0 1px 2px rgba(11,34,101,.05),0 8px 24px rgba(11,34,101,.07);--press:#EEF1F7;--onnavy:#FFFFFF;--onnavy2:rgba(255,255,255,.72);--onnavy3:rgba(255,255,255,.14)}
.dd.dark{--bg:#050D26;--surface:#0E1A42;--surface2:#142354;--surface3:#1B2D66;--ink:#F3F5FA;--ink2:#AAB5D0;--ink3:#6C7A9E;--rule:#1D2C5F;--rule2:#2C3D75;--pri:#FFFFFF;--pri-ink:#0B2265;--go:#3FCB84;--go-bg:#113522;--stop:#FF6B80;--stop-bg:#3D1526;--warn:#F2B04A;--warn-bg:#3A2A10;--info:#8FB1FF;--info-bg:#17295F;--shadow:none;--press:#172656}
.dd,.dd *{box-sizing:border-box}
.dd{--f:'Archivo',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;--fc:'Archivo','Avenir Next Condensed','HelveticaNeue-CondensedBold','Arial Narrow',system-ui,sans-serif;min-height:100vh;background:var(--bg);color:var(--ink);font-family:var(--f);font-size:15px;line-height:1.4;font-feature-settings:'tnum' 1,'ss01' 1;-webkit-font-smoothing:antialiased;padding-bottom:calc(84px + env(safe-area-inset-bottom));max-width:680px;margin:0 auto;font-variant-numeric:tabular-nums}
:where(.dd button){font-family:inherit;color:inherit;cursor:pointer;background:none;border:none;padding:0;font-size:inherit;-webkit-tap-highlight-color:transparent}
.dd input,.dd textarea,.dd select{font-family:inherit;font-size:16px;color:var(--ink);background:var(--surface);border:1.5px solid var(--rule2);border-radius:12px;padding:11px 13px;width:100%;outline:none}
.dd input::placeholder,.dd textarea::placeholder{color:var(--ink3)}
.dd input:focus,.dd textarea:focus,.dd select:focus{border-color:var(--navy2);box-shadow:0 0 0 3px rgba(21,58,143,.15)}
.dd button:focus-visible,.dd .rowbtn:focus-visible{outline:3px solid var(--red2);outline-offset:2px}
.dd select option{background:var(--surface)}
.cond{font-family:var(--fc);font-stretch:76%;letter-spacing:-.012em}
.lab{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
@media (prefers-reduced-motion:reduce){.dd *{animation:none!important;transition:none!important}}
@keyframes viewIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@keyframes rowIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes growx{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@keyframes fadeOut{to{opacity:0}}
@keyframes down{to{transform:translateY(60px);opacity:.6}}
.view{animation:viewIn .32s cubic-bezier(.2,.8,.2,1) backwards}
.prow.in,.act{animation:rowIn .36s cubic-bezier(.2,.8,.2,1) both}
.sbg.closing{animation:fadeOut .2s ease-out forwards}
.splash{position:fixed;inset:0;z-index:100;background:linear-gradient(160deg,#173F98 0%,#0B2265 55%,#07194C 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;color:#fff;animation:fade .25s ease-out both}
.splash.out{animation:fadeOut .5s ease-in forwards;pointer-events:none}
.splash img{width:min(70vw,300px);height:auto;animation:logoIn .75s cubic-bezier(.2,.8,.2,1) both;filter:drop-shadow(0 10px 30px rgba(0,0,0,.35));position:relative;z-index:2}
.splash .rule,.splash .hype,.splash .sub{position:relative;z-index:2}
.splash .field{position:absolute;inset:0;overflow:hidden}
.splash .glow{position:absolute;left:50%;top:50%;width:140vw;height:140vw;max-width:900px;max-height:900px;transform:translate(-50%,-50%);background:radial-gradient(circle,rgba(255,255,255,.14) 0,rgba(255,255,255,.05) 22%,rgba(255,255,255,0) 48%);animation:breathe 4.4s ease-in-out both}
@keyframes breathe{0%{opacity:0;transform:translate(-50%,-50%) scale(.7)}25%{opacity:1}100%{opacity:.8;transform:translate(-50%,-50%) scale(1.15)}}
.splash .rail{position:absolute;top:0;bottom:0;width:38px;background-image:repeating-linear-gradient(to bottom,transparent 0 30px,rgba(255,255,255,.28) 30px 32px,transparent 32px 80px),repeating-linear-gradient(to bottom,transparent 0 70px,rgba(255,255,255,.14) 70px 72px,transparent 72px 80px);background-size:100% 80px,60% 80px;animation:rail 4.4s cubic-bezier(.3,0,.7,1) both;mask-image:linear-gradient(to bottom,transparent 0,#000 12%,#000 88%,transparent 100%);-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 12%,#000 88%,transparent 100%)}
.splash .rail.l{left:14px;background-position:0 0,0 0;border-left:2px solid rgba(255,255,255,.22)}
.splash .rail.r{right:14px;background-position:100% 0,100% 0;border-right:2px solid rgba(255,255,255,.22)}
@keyframes rail{from{background-position-y:0,0}to{background-position-y:1200px,1200px}}
.splash .goal{position:absolute;left:14px;right:14px;top:-4px;height:3px;background:rgba(255,255,255,.7);box-shadow:0 0 18px 4px rgba(255,255,255,.35);opacity:0;animation:goal 4.4s cubic-bezier(.3,0,.7,1) both}
@keyframes goal{0%,62%{top:-4px;opacity:0}70%{opacity:1}100%{top:105%;opacity:0}}
.splash .sheen{position:absolute;left:-40%;top:0;bottom:0;width:40%;background:linear-gradient(105deg,rgba(255,255,255,0) 0,rgba(255,255,255,.10) 45%,rgba(255,255,255,0) 100%);transform:skewX(-14deg);animation:sheen 2.2s 1.1s cubic-bezier(.2,.8,.2,1) both}
@keyframes sheen{from{left:-45%}to{left:120%}}
@keyframes logoIn{from{opacity:0;transform:scale(.84) translateY(12px)}to{opacity:1;transform:none}}
.splash .rule{width:64px;height:3px;background:var(--red);border-radius:2px;animation:growx .6s .45s cubic-bezier(.2,.8,.2,1) both;transform-origin:center}
.splash .hype{font-size:14px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:rgba(255,255,255,.9);height:20px;min-width:260px;text-align:center}
.splash .hype span{display:block;animation:hypeIn .5s cubic-bezier(.2,.8,.2,1) both}
@keyframes hypeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.splash .sub{position:absolute;bottom:calc(30px + env(safe-area-inset-bottom));font-size:10.5px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.45)}
.sheet.closing{animation:down .22s ease-in forwards}

/* ---- Masthead (Giants navy) ---- */
.mast{position:sticky;top:0;z-index:25;background:linear-gradient(168deg,#173F98 0%,#0B2265 48%,#08194C 100%);color:var(--onnavy);border-bottom:3px solid var(--red);box-shadow:0 6px 20px rgba(5,13,38,.25)}
.mast .bar{padding:12px 16px 2px;display:grid;grid-template-columns:1fr auto auto;align-items:center;gap:12px}
.wm{display:flex;align-items:flex-end;gap:10px;min-width:0}
.wm svg{height:30px;width:auto;display:block;flex:none;filter:drop-shadow(0 1px 0 rgba(0,0,0,.25))}
.wm .logo{height:32px;width:auto;max-width:180px;display:block;flex:none;object-fit:contain;filter:drop-shadow(0 1px 0 rgba(0,0,0,.25))}
.wm .lg{font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--onnavy2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-bottom:2px}
.mast .rec{text-align:right;white-space:nowrap}
.mast .rec .n{font-size:36px;font-weight:900;line-height:1;letter-spacing:-.02em;color:#fff;display:block}
.mast .rec .s{font-size:10px;color:var(--onnavy2);font-weight:700;letter-spacing:.14em;text-transform:uppercase;display:block;margin-top:4px}
.mast .ibtn{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#fff;background:var(--onnavy3);flex:none}
.mast .ibtn:active{background:rgba(255,255,255,.26)}
.wkstrip{display:flex;gap:8px;overflow-x:auto;padding:12px 16px 10px;scrollbar-width:none;-webkit-overflow-scrolling:touch;scroll-padding:16px}
.wkstrip::-webkit-scrollbar{display:none}
.wkc{flex:none;width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,.12);color:#fff;display:grid;place-items:center;position:relative;transition:transform .25s cubic-bezier(.2,.8,.2,1),background .2s,color .2s,box-shadow .2s;border:1.5px solid transparent}
.wkc:active{transform:scale(.92)}
.wkc .w{font-size:18px;font-weight:800;line-height:1;transform:translateY(-1px)}
.wkc .r{position:absolute;left:50%;bottom:6px;width:5px;height:5px;border-radius:50%;transform:translateX(-50%);background:transparent;transition:background .2s}
.wkc .r.W{background:#5CE39B}.wkc .r.L{background:#FF7A8C}.wkc .r.T{background:#fff}
.wkc.on{background:#fff;color:var(--navy);transform:scale(1.1);box-shadow:0 6px 16px rgba(0,0,0,.3)}
.wkc.on .r.W{background:var(--go)}.wkc.on .r.L{background:var(--red)}
.wkc.now:not(.on){border-color:rgba(255,255,255,.75)}
.wkc.po{background:transparent;border:1.5px dashed rgba(255,255,255,.35)}
.wkline{padding:0 16px 10px;display:flex;align-items:baseline;justify-content:space-between;gap:10px}
.wkline .d{font-size:12.5px;color:var(--onnavy2);font-weight:500}
.wkline .d b{color:#fff;font-weight:800;font-size:13px;margin-right:8px;letter-spacing:.1em;text-transform:uppercase}
.wkline .o{font-size:16px;font-weight:700;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:right;color:#fff}
.wkline .o small{font-weight:600;color:var(--onnavy2);font-size:11px;margin-right:6px;text-transform:uppercase;letter-spacing:.12em}
.riv{display:inline-block;margin-left:6px;font-size:9.5px;font-weight:800;color:#fff;background:var(--red);border-radius:5px;padding:3px 6px;vertical-align:middle;letter-spacing:.1em;text-transform:uppercase}

/* ---- Layout ---- */
.pg{padding:14px 14px 0}
.card{background:var(--surface);border:1px solid var(--rule);border-radius:18px;margin-bottom:12px;overflow:hidden;box-shadow:var(--shadow)}
.ch{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 16px 8px}
.ch h2{margin:0;font-size:13.5px;font-weight:800;line-height:1;letter-spacing:.14em;display:flex;align-items:center;gap:9px;text-transform:uppercase;font-stretch:100%}
.ch h2::before{content:"";width:4px;height:18px;border-radius:2px;background:var(--red)}
.ch .aux{font-size:12px;color:var(--ink2);text-align:right;flex:none;font-weight:500}
.cb{padding:0 16px 14px}
.hint{font-size:13px;color:var(--ink2);padding:8px 16px 14px;line-height:1.45}
.empty{padding:16px;color:var(--ink2);font-size:14px;line-height:1.45}
.muted{color:var(--ink2)}.small{font-size:12.5px}
.save{font-size:11px;color:var(--ink3);text-align:right;padding:6px 16px 0}
.save.err{color:var(--stop)}

/* ---- Player rows ---- */
.prow{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:10px 16px;border-top:1px solid var(--rule);width:100%;text-align:left;min-height:62px}
.prow:first-child,.ch+.prow,.hint+.prow,.cb+.prow{border-top:none}
.prow>*{min-width:0}
.prow.acts{grid-template-columns:1fr auto}
.rowhit{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;text-align:left;min-width:0;width:100%;border-radius:12px;transition:background .1s}
.rowhit:active{background:var(--press)}
.rowhit>*{min-width:0}
.prow.tap{transition:background .1s}
.prow.tap:active{background:var(--press)}
.prow.warn{background:var(--stop-bg)}
.prow.dim{opacity:.5}
.badge{width:44px;height:44px;border-radius:13px;display:grid;place-items:center;font-size:14px;font-weight:900;letter-spacing:.04em;color:#fff;position:relative;flex:none;background:var(--ink3);box-shadow:0 1px 2px rgba(11,34,101,.12)}
.badge .bx{position:absolute;inset:0;border-radius:13px;overflow:hidden;display:grid;place-items:center;background-image:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.04) 48%,rgba(0,0,0,.06));box-shadow:inset 0 1px 0 rgba(255,255,255,.25)}
.badge.isflex .bx{padding-top:4px}
.badge .ln{position:absolute;left:0;right:0;bottom:0;height:3px}
.badge .flx{position:absolute;top:-7px;left:50%;transform:translateX(-50%);background:var(--navy);color:#fff;font-size:7.5px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;padding:2px 5px;border-radius:5px;box-shadow:0 1px 3px rgba(0,0,0,.25);border:1.5px solid var(--surface);line-height:1;font-stretch:100%}
.dark .badge .flx{background:#fff;color:var(--navy);border-color:var(--surface)}
.board .badge .flx{border-color:#0B2265}
.badge.slot{background:var(--surface3);color:var(--ink2);box-shadow:none;font-size:12px;letter-spacing:.08em}
.badge.empty{background:var(--surface2);color:var(--ink3);box-shadow:none;font-size:12px;letter-spacing:.08em;border:1.5px solid var(--rule)}
.pname{font-weight:650;font-size:16px;line-height:1.15;letter-spacing:-.008em;display:flex;align-items:center;gap:6px;min-width:0}
.pname .t{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.psub{font-size:12.5px;color:var(--ink2);margin-top:3px;font-weight:500;display:flex;align-items:center;gap:6px;flex-wrap:wrap;line-height:1.2}
.psub b{color:var(--ink);font-weight:700}
.psub .bye{color:var(--stop);font-weight:800}
.pright{display:flex;align-items:center;gap:8px;justify-content:flex-end}
.val{text-align:right;line-height:1;min-width:44px}
.val .n{font-size:24px;font-weight:850;letter-spacing:-.02em}
.val .l{font-size:9.5px;color:var(--ink3);margin-top:3px;font-family:var(--f);font-stretch:100%;font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.val .tier{height:3px;border-radius:2px;background:var(--surface3);margin:5px 0 0 auto;width:40px;overflow:hidden}
.val .tier i{display:block;height:100%;background:var(--navy2);border-radius:2px;transform-origin:left;animation:growx .7s cubic-bezier(.2,.8,.2,1) both}
.dark .val .tier i{background:#8FB1FF}
.val.na .n{color:var(--ink3);font-size:15px;font-weight:700}
.val .d{font-size:12.5px;font-weight:800;margin-top:3px}
.val .d.up{color:var(--go)}.val .d.dn{color:var(--stop)}
.pill{font-size:10px;font-weight:800;border-radius:6px;padding:3px 6px;letter-spacing:.08em;flex:none;line-height:1.25;text-transform:uppercase}
.pill.q{background:var(--warn-bg);color:var(--warn)}.pill.d{background:var(--stop-bg);color:var(--stop)}.pill.o{background:var(--stop);color:#fff}.pill.ir{background:var(--surface3);color:var(--ink2)}
.pill.bye{background:var(--stop-bg);color:var(--stop)}
.pill.set{background:var(--go-bg);color:var(--go)}.pill.auto{background:var(--info-bg);color:var(--info)}
.pill.up{background:var(--go-bg);color:var(--go)}.pill.own{background:var(--surface3);color:var(--ink2)}
.pill.fl{background:var(--surface3);color:var(--ink2);text-transform:none;letter-spacing:0;font-weight:700}
.chev{color:var(--ink3);font-size:20px;line-height:1}
.vg{padding:10px 16px;border-top:1px solid var(--rule)}
.ch+.vg,.hint+.vg{border-top:none}
.vgt{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.vgt .tm{font-size:17px;font-weight:800;letter-spacing:.02em}
.vgt .at{color:var(--ink3);font-size:12px;font-weight:700}
.vgn{display:flex;gap:18px}
.vgn span{display:flex;flex-direction:column}
.vgn b{font-size:18px;font-weight:800;line-height:1}
.vgn small{font-size:9.5px;color:var(--ink3);font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-top:3px}
.brk{padding:0 16px 8px;display:grid;gap:2px}
.brk>div{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:8px 0;border-top:1px solid var(--rule);position:relative}
.brk>div:first-child{border-top:none}
.brk .lab2{font-size:14px;font-weight:600}
.brk .lab2 small{display:block;color:var(--ink2);font-size:12px;font-weight:500;margin-top:2px}
.brk b{font-size:20px;font-weight:800}
.brk i{position:absolute;left:0;bottom:-1px;height:2px;background:var(--navy);border-radius:2px;opacity:.55}
.dark .brk i{background:#8FB1FF}
.vp{display:flex;flex-wrap:wrap;gap:8px 18px;padding:0 16px 8px}
.vp span{display:flex;flex-direction:column}
.vp b{font-size:20px;font-weight:800;line-height:1}
.vp small{font-size:9.5px;color:var(--ink3);font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-top:3px}
.val .l.veg{color:var(--go)}
.mx{font-size:9.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;border-radius:5px;padding:2px 5px;line-height:1.2}
.mx.soft{background:var(--go-bg);color:var(--go)}.mx.tough{background:var(--stop-bg);color:var(--stop)}
.chip.soft{border-color:var(--go);color:var(--go)}.chip.tough{border-color:var(--stop);color:var(--stop)}
.chip .rk{display:block;font-size:10px;font-weight:600;color:var(--ink2);letter-spacing:0;margin-top:2px}
.sos{padding:4px 16px 12px;overflow-x:auto}
.sos table{border-collapse:separate;border-spacing:3px;width:100%}
.sos th{font-size:10px;font-weight:700;color:var(--ink2);letter-spacing:.08em;text-transform:uppercase;text-align:center;padding:2px 0}
.sos th.n{text-align:left}
.sos td{text-align:center;font-size:11px;font-weight:800;color:#fff;border-radius:6px;height:28px;min-width:30px}
.sos td.n{text-align:left;color:var(--ink);font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px;padding-right:6px}
.sos td.bye{background:var(--surface3);color:var(--ink3);font-size:9px;letter-spacing:.06em}
.sos td.ros{background:var(--surface2);color:var(--ink);font-weight:800}
.chip{transition:transform .1s,background .2s,color .2s,border-color .2s}

/* ---- Action list ---- */
.act{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 16px 12px 12px;border-top:1px solid var(--rule);width:100%;text-align:left;border-left:4px solid transparent}
.act:first-of-type{border-top:none}
.act:active{background:var(--press)}
.act.bad{border-left-color:var(--stop)}.act.warn{border-left-color:var(--warn)}.act.info{border-left-color:var(--info)}
.act .ic{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;font-size:16px;font-weight:900;flex:none}
.act.bad .ic{background:var(--stop-bg);color:var(--stop)}.act.warn .ic{background:var(--warn-bg);color:var(--warn)}.act.info .ic{background:var(--info-bg);color:var(--info)}
.act .tx{font-size:15px;line-height:1.3;font-weight:650;letter-spacing:-.005em}
.act .tx small{display:block;color:var(--ink2);font-size:12.5px;margin-top:2px;font-weight:500}
.act .go{font-size:12.5px;font-weight:700;letter-spacing:.02em;color:var(--pri-ink);background:var(--pri);border-radius:999px;padding:8px 13px;flex:none}
.allgood{display:flex;align-items:center;gap:12px;padding:14px 16px 16px;color:var(--ink2);font-size:14.5px;line-height:1.4}
.allgood .ic{width:36px;height:36px;border-radius:50%;background:var(--go-bg);color:var(--go);display:grid;place-items:center;font-weight:900;flex:none}

/* ---- Matchup scoreboard ---- */
.board{background:linear-gradient(160deg,#153A8F 0%,#0B2265 55%,#08194C 100%);color:#fff;border-radius:18px;margin-bottom:12px;padding:14px 16px 12px;box-shadow:0 10px 30px rgba(11,34,101,.25);position:relative;overflow:hidden}
.board::after{content:"";position:absolute;left:0;right:0;bottom:0;height:3px;background:var(--red)}
.board .kick{display:flex;justify-content:space-between;align-items:baseline;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:var(--onnavy2)}
.board .kick b{color:#fff}
.board .side{display:grid;grid-template-columns:1fr auto;gap:12px;align-items:center;padding:10px 0 4px}
.board .who{font-size:22px;font-weight:850;line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-transform:uppercase;letter-spacing:.02em}
.board .sub{font-size:12px;color:var(--onnavy2);margin-top:6px;font-weight:500}
.board .tot{font-size:52px;font-weight:900;line-height:1;letter-spacing:-.03em}
.board .bars{display:flex;gap:3px;height:8px;margin:8px 0 6px;border-radius:4px;overflow:hidden}
.board .bars i{display:block;height:100%;transition:width .6s cubic-bezier(.2,.8,.2,1)}
.board .bars i.m{background:#fff}.board .bars i.t{background:rgba(255,255,255,.28)}
.board .edge{font-size:13.5px;color:var(--onnavy2);line-height:1.45;padding:6px 0 10px}
.board .edge b{color:#fff;font-weight:800}
.board .btns{padding:0 0 8px}
.board .btn{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.28);color:#fff}
.board .btn:active{background:rgba(255,255,255,.22)}
.board .prow{border-top-color:rgba(255,255,255,.12);padding-left:0;padding-right:0}
.board .prow .psub,.board .prow .val .l{color:var(--onnavy2)}
.board .prow .psub b{color:#fff}
.board .prow.tap:active{background:rgba(255,255,255,.08)}
.board .badge.empty,.board .badge.slot{background:rgba(255,255,255,.14);color:#fff;border-color:transparent}
.board .val .tier{background:rgba(255,255,255,.18)}.board .val .tier i{background:#fff}

/* ---- Buttons, chips, segments ---- */
.btns{display:flex;gap:8px;flex-wrap:wrap;padding:10px 16px 14px}
.btn{border:1.5px solid var(--rule2);background:var(--surface);border-radius:12px;padding:11px 15px;font-size:14px;font-weight:650;letter-spacing:-.005em;line-height:1.1;transition:transform .1s,background .1s;min-height:42px;color:var(--ink)}
.btn:active{transform:scale(.97)}
.btn.pri{background:var(--pri);color:var(--pri-ink);border-color:var(--pri)}
.btn.hl{background:var(--info-bg);color:var(--info);border-color:var(--info-bg)}
.btn.danger{color:var(--stop);border-color:var(--stop-bg);background:var(--stop-bg)}
.btn.sm{padding:7px 12px;font-size:13px;min-height:34px;border-radius:10px}
.btn:disabled{opacity:.4;transform:none}
.chips{display:flex;gap:6px;flex-wrap:wrap}
.chip{border:1.5px solid var(--rule2);background:var(--surface);border-radius:999px;padding:7px 13px;font-size:13px;font-weight:650;transition:transform .1s;color:var(--ink)}
.chip:active{transform:scale(.96)}
.chip.on{background:var(--pri);color:var(--pri-ink);border-color:var(--pri)}
.chip.hl.on{background:var(--red);color:#fff;border-color:var(--red)}
.chip.static{cursor:default}
.seg{display:flex;background:var(--surface3);border-radius:12px;padding:3px;gap:2px}
.seg button{flex:1;padding:9px 4px;font-size:13px;font-weight:700;color:var(--ink2);border-radius:10px}
.seg button.on{background:var(--surface);color:var(--ink);box-shadow:0 1px 3px rgba(0,0,0,.15)}
.sub-scroll{display:flex;gap:6px;overflow-x:auto;padding:0 0 12px;scrollbar-width:none}
.sub-scroll::-webkit-scrollbar{display:none}
.sub-scroll .chip{flex:none}

/* ---- Score entry ---- */
.score{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:end;padding:4px 16px 16px}
.score label{font-size:10.5px;color:var(--ink2);display:block;margin-bottom:6px;font-weight:700;text-transform:uppercase;letter-spacing:.14em}
.score input{text-align:center;font-size:26px;font-weight:850;font-family:var(--fc);font-stretch:76%;padding:8px}
.score .res{font-size:30px;font-weight:900;width:44px;text-align:center;padding-bottom:8px;color:var(--ink3)}
.score .res.W{color:var(--go)}.score .res.L{color:var(--stop)}

/* ---- Stats ---- */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:6px 16px 14px}
.stat{background:var(--surface2);border-radius:14px;padding:12px 6px 10px;text-align:center}
.stat .v{font-size:24px;font-weight:850;line-height:1;letter-spacing:-.02em}
.stat .k{font-size:10.5px;color:var(--ink2);margin-top:6px;font-weight:600;letter-spacing:.02em}
.stat .v.up{color:var(--go)}.stat .v.dn{color:var(--stop)}

/* ---- Bye map ---- */
.byewk{display:grid;grid-template-columns:50px 1fr;gap:12px;align-items:start;padding:10px 16px;border-top:1px solid var(--rule)}
.byewk .w{font-size:24px;font-weight:850;line-height:1;letter-spacing:-.02em}
.byewk .w small{display:block;font-size:10px;color:var(--ink2);font-family:var(--f);font-stretch:100%;font-weight:700;margin-top:4px;letter-spacing:.06em;text-transform:uppercase}
.byewk .bar{height:6px;border-radius:3px;background:var(--surface3);margin:5px 0 7px;overflow:hidden}
.byewk .bar i{display:block;height:100%;background:var(--navy2)}
.byewk .bar.hot i{background:var(--red)}
.byewk .names{font-size:13.5px;line-height:1.5}
.byewk .names b{font-weight:700}

/* ---- News ---- */
.nitem{border-top:1px solid var(--rule);padding:12px 16px;width:100%;text-align:left}
.nitem:first-child{border-top:none}
.nitem .who{font-weight:700;font-size:14px;display:flex;gap:8px;align-items:center}
.nitem .who span{color:var(--ink2);font-weight:600;font-size:12.5px}
.nitem p{margin:5px 0 0;font-size:14px;line-height:1.5;color:var(--ink)}
.nitem.clip p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}

/* ---- Log, notes ---- */
.log{padding:0 16px 12px}
.log div{padding:9px 0;border-top:1px solid var(--rule);font-size:14px;display:flex;gap:12px;line-height:1.35}
.log div:first-child{border-top:none}
.log .t{color:var(--ink2);flex:none;width:44px;font-size:12px;padding-top:2px;font-weight:600}
textarea.notes{min-height:120px;resize:vertical;line-height:1.5}

/* ---- Power rankings ---- */
.pr .prow{grid-template-columns:36px 1fr auto}
.pr .rk{font-size:22px;font-weight:850;color:var(--ink3);letter-spacing:-.02em}
.pr .prow.mine{background:var(--info-bg)}
.pr .prow.mine .rk{color:var(--info)}
.posbars{display:flex;gap:6px;margin-top:5px}
.posbars span{display:flex;align-items:center;gap:3px;font-size:11px;color:var(--ink2);font-weight:700}
.posbars i{display:inline-block;width:24px;height:5px;border-radius:3px;background:var(--surface3);position:relative;overflow:hidden}
.posbars i b{position:absolute;left:0;top:0;bottom:0;background:var(--ink3);border-radius:3px}
.posbars i b.up{background:var(--go)}.posbars i b.dn{background:var(--stop)}

/* ---- Trade, compare ---- */
.tr .prow{grid-template-columns:28px 1fr auto}
.ck{width:24px;height:24px;border:2px solid var(--rule2);border-radius:8px;display:grid;place-items:center;transition:all .12s;flex:none;font-size:13px;font-weight:900}
.ck.on{background:var(--pri);border-color:var(--pri);color:var(--pri-ink)}
.delta{font-size:30px;font-weight:900;line-height:1;letter-spacing:-.02em}
.delta.up{color:var(--go)}.delta.dn{color:var(--stop)}
.cmp{display:grid;grid-template-columns:44px 1fr 1fr;gap:10px;padding:9px 16px;border-top:1px solid var(--rule);font-size:14px;align-items:center}
.cmp:first-child{border-top:none}
.cmp .s{font-weight:800}
.cmp .better{color:var(--go);font-weight:800}
.cmp .n{font-size:12px;color:var(--ink2)}

/* ---- Sheet ---- */
.sbg{position:fixed;inset:0;background:rgba(5,13,38,.55);backdrop-filter:blur(3px);z-index:50;display:flex;align-items:flex-end;justify-content:center;animation:fade .18s ease-out}
@keyframes fade{from{opacity:0}to{opacity:1}}
.sheet{background:var(--bg);color:var(--ink);width:100%;max-width:680px;max-height:92vh;border-radius:24px 24px 0 0;display:flex;flex-direction:column;animation:up .28s cubic-bezier(.2,.8,.2,1);box-shadow:0 -10px 40px rgba(0,0,0,.3)}
@keyframes up{from{transform:translateY(48px)}to{transform:none}}
.grab{width:40px;height:5px;border-radius:3px;background:var(--rule2);margin:8px auto 0}
.sh{display:flex;align-items:flex-start;justify-content:space-between;padding:10px 16px 10px;gap:12px}
.sh .t{font-size:24px;font-weight:800;line-height:1.05;letter-spacing:-.02em}
.sh .s{font-size:13px;color:var(--ink2);margin-top:5px;line-height:1.35}
.sh .x{width:36px;height:36px;border-radius:12px;background:var(--surface3);display:grid;place-items:center;font-size:14px;flex:none;color:var(--ink2)}
.sb{overflow:auto;padding:0 0 calc(18px + env(safe-area-inset-bottom))}
.ssec{padding:12px 16px 6px;font-size:10.5px;color:var(--ink2);font-weight:700;letter-spacing:.14em;text-transform:uppercase;display:flex;justify-content:space-between;align-items:baseline}
.field{padding:6px 16px 10px}
.field label{display:block;font-size:10.5px;color:var(--ink2);margin-bottom:6px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.sheet .card{margin:0 16px 10px}
.srcline{display:flex;gap:6px;padding:0 16px 8px;flex-wrap:wrap}
.srcline span{font-size:12px;background:var(--surface2);border-radius:8px;padding:4px 9px;color:var(--ink2);font-weight:600}
.srcline span b{color:var(--ink);font-weight:800}
.hero{margin:0 16px 10px;background:linear-gradient(160deg,#153A8F,#0B2265);color:#fff;border-radius:16px;padding:14px 16px;display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:center}
.hero .badge{width:56px;height:56px;font-size:19px;border-radius:14px}
.hero .big{font-size:44px;font-weight:900;line-height:1;letter-spacing:-.03em}
.hero .lab{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--onnavy2);font-weight:700;margin-top:4px}

/* ---- Coach ---- */
.coachhead{display:flex;align-items:center;gap:12px;padding:4px 2px 12px}
.coachhead .av{width:44px;height:44px;border-radius:14px;background:linear-gradient(160deg,#153A8F,#0B2265);display:grid;place-items:center;color:#fff;flex:none;box-shadow:0 6px 16px rgba(11,34,101,.25)}
.coachhead .nm{font-size:17px;font-weight:800;letter-spacing:-.01em;display:flex;align-items:center;gap:8px}
.coachhead .nm i{width:8px;height:8px;border-radius:50%;background:var(--go);box-shadow:0 0 0 3px var(--go-bg)}
.coachhead .st{font-size:12.5px;color:var(--ink2);margin-top:2px}
.sugg{display:flex;gap:8px;overflow-x:auto;padding:0 0 12px;scrollbar-width:none}
.sugg::-webkit-scrollbar{display:none}
.sg{flex:none;width:150px;background:var(--surface);border:1px solid var(--rule);border-radius:16px;padding:12px 12px 11px;text-align:left;box-shadow:var(--shadow);transition:transform .15s;display:flex;flex-direction:column;gap:8px}
.sg:active{transform:scale(.97)}
.sg .ic{width:30px;height:30px;border-radius:9px;background:var(--info-bg);color:var(--info);display:grid;place-items:center}
.sg .t{font-size:14px;font-weight:700;line-height:1.2;letter-spacing:-.005em}
.sg .s{font-size:12px;color:var(--ink2);line-height:1.3}
.msgs{display:flex;flex-direction:column;gap:14px;padding:0 0 12px}
.msg{max-width:94%;font-size:15px;line-height:1.45;animation:rowIn .3s cubic-bezier(.2,.8,.2,1) both}
.msg.u{align-self:flex-end;background:var(--navy);color:#fff;border-radius:18px 18px 6px 18px;padding:11px 15px;font-weight:500}
.dark .msg.u{background:#fff;color:var(--navy)}
.msg.a{align-self:stretch;max-width:100%;display:grid;grid-template-columns:30px 1fr;gap:10px}
.msg.a .av{width:30px;height:30px;border-radius:10px;background:linear-gradient(160deg,#153A8F,#0B2265);color:#fff;display:grid;place-items:center;margin-top:2px}
.msg.a .body{background:var(--surface);border:1px solid var(--rule);border-radius:6px 18px 18px 18px;padding:12px 14px;box-shadow:var(--shadow);min-width:0}
.msg.a .who{font-size:10.5px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--ink2);margin-bottom:6px;display:flex;justify-content:space-between}
.msg.a .who span{letter-spacing:0;text-transform:none;font-weight:500}
.msg.a.err .body{border-color:var(--stop);color:var(--stop)}
.md p{margin:0 0 10px;line-height:1.5}.md p:last-child{margin:0}
.md b.pn{font-weight:700;color:var(--navy)}.dark .md b.pn{color:#fff}
.md ul{margin:0 0 10px;padding:2px 12px;list-style:none;background:var(--surface2);border-radius:12px}
.md li{padding:9px 0 9px 16px;position:relative;border-top:1px solid var(--rule);line-height:1.45}
.md li:first-child{border-top:none}
.md li::before{content:"";position:absolute;left:2px;top:15px;width:6px;height:6px;border-radius:50%;background:var(--red)}
.md .h{font-weight:800;text-transform:uppercase;letter-spacing:.12em;font-size:10.5px;color:var(--ink2);margin:14px 0 8px;padding-top:12px;border-top:1px solid var(--rule);display:flex;align-items:center;gap:8px}
.md .h::before{content:"";width:3px;height:12px;border-radius:2px;background:var(--red)}
.md .h:first-child{margin-top:0;padding-top:0;border-top:none}
.verdict{background:var(--info-bg);border-left:4px solid var(--navy);border-radius:10px;padding:10px 12px;margin:0 0 10px;font-weight:600;line-height:1.4}
.dark .verdict{border-left-color:#8FB1FF}
.verdict b{font-weight:800}
.mlu{display:grid;margin:4px 0 12px;border:1px solid var(--rule);border-radius:12px;overflow:hidden}
.mlu div{display:grid;grid-template-columns:44px 1fr auto;gap:10px;align-items:center;font-size:14.5px;padding:8px 10px;border-top:1px solid var(--rule)}
.mlu div:first-child{border-top:none}
.mlu div:nth-child(even){background:var(--surface2)}
.mlu div b{font-size:10px;font-weight:800;letter-spacing:.1em;color:#fff;background:var(--navy);border-radius:6px;padding:4px 0;text-align:center}
.dark .mlu div b{color:var(--navy);background:#fff}
.mlu div b.flex{background:var(--red);color:#fff}
.mlu div .nm{font-weight:700;letter-spacing:-.005em}
.mlu div small{color:var(--ink2);font-size:12px;text-align:right;max-width:120px;line-height:1.25}
.mv{display:flex;align-items:center;gap:10px;font-size:14.5px;padding:8px 0;border-top:1px solid var(--rule)}
.mv:first-child{border-top:none}
.mv>b{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;border-radius:6px;padding:4px 8px;min-width:52px;text-align:center}
.mv.add>b{background:var(--go-bg);color:var(--go)}.mv.drop>b{background:var(--stop-bg);color:var(--stop)}
.mv span{font-weight:600}
.mv span b.pn{font-weight:700}
.srcs{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;padding-top:10px;border-top:1px solid var(--rule)}
.srcs a{font-size:11.5px;font-weight:600;color:var(--info);background:var(--info-bg);border-radius:999px;padding:4px 9px;text-decoration:none;max-width:160px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.srcs .lbl{font-size:10.5px;color:var(--ink2);font-weight:700;letter-spacing:.1em;text-transform:uppercase;align-self:center}
.thinking{display:flex;align-items:center;gap:10px;color:var(--ink2);font-size:13.5px;padding:4px 0}
.thinking .dots{display:inline-flex;gap:4px}
.thinking i{width:6px;height:6px;border-radius:50%;background:var(--ink3);animation:blink 1.1s infinite}
.thinking i:nth-child(2){animation-delay:.18s}.thinking i:nth-child(3){animation-delay:.36s}
@keyframes blink{0%,80%,100%{opacity:.25}40%{opacity:1}}
.composer{position:fixed;bottom:calc(70px + env(safe-area-inset-bottom));left:0;right:0;display:flex;justify-content:center;pointer-events:none;z-index:20}
.composer .in{pointer-events:auto;width:100%;max-width:680px;display:flex;gap:8px;padding:8px 12px 10px;background:linear-gradient(to top,var(--bg) 75%,rgba(0,0,0,0));align-items:flex-end}
.composer textarea{resize:none;min-height:48px;max-height:120px;line-height:1.35;padding:13px 15px;border-radius:24px}
.composer .send{width:48px;height:48px;border-radius:50%;background:var(--pri);color:var(--pri-ink);display:grid;place-items:center;flex:none;transition:transform .12s,opacity .2s}
.composer .send:active{transform:scale(.92)}
.composer .send:disabled{opacity:.35}
/* ---- Nav ---- */
.nav{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:center;z-index:30;background:var(--navy);box-shadow:0 -6px 20px rgba(5,13,38,.25)}
.dark .nav{background:#0A1740;border-top:1px solid var(--rule)}
.nav .in{width:100%;max-width:680px;display:flex;padding-bottom:env(safe-area-inset-bottom)}
.nav button{flex:1;padding:10px 0 9px;display:flex;flex-direction:column;align-items:center;gap:4px;font-size:10.5px;font-weight:600;letter-spacing:.04em;color:rgba(255,255,255,.55);position:relative;transition:color .12s;letter-spacing:.3px}
.nav button.on{color:#fff}
.nav button.on::before{content:"";position:absolute;top:0;left:50%;transform:translateX(-50%);width:28px;height:3px;border-radius:0 0 3px 3px;background:var(--red2)}
.nav svg{width:23px;height:23px}
.nav .dot{position:absolute;left:calc(50% + 8px);top:7px;width:9px;height:9px;border-radius:50%;background:var(--red2);border:2px solid var(--navy)}

/* ---- Toast ---- */
.toast{position:fixed;left:0;right:0;bottom:calc(78px + env(safe-area-inset-bottom));display:flex;justify-content:center;z-index:40;pointer-events:none}
.toast .in{pointer-events:auto;background:var(--ink);color:var(--bg);border-radius:14px;padding:12px 16px;display:flex;align-items:center;gap:16px;max-width:calc(100% - 32px);box-shadow:0 8px 24px rgba(0,0,0,.3);animation:up .22s cubic-bezier(.2,.8,.2,1);font-size:14px;font-weight:600}
.dark .toast .in{background:#fff;color:var(--navy)}
.toast .in button{color:#FF8DA1;font-weight:800;flex:none;text-transform:uppercase;letter-spacing:.1em;font-size:12px}
.dark .toast .in button{color:var(--red)}

/* ---- Desktop ---- */
.nav .brand,.nav .spacer,.nav .gearbtn{display:none}
.cols{display:block}
@media (min-width:900px){
  .dd{max-width:none;padding-left:236px;padding-bottom:48px}
  .mast{display:flex;flex-wrap:wrap;align-items:center;padding:14px 28px 12px;gap:0 28px}
  .mast .wm,.mast .ibtn{display:none}
  .mast .bar{order:2;padding:0;display:flex;grid-template-columns:none}
  .mast .wkline{order:1;flex:1;padding:0;min-width:0}
  .mast .wkline .d{font-size:13px}
  .mast .wkline .o{font-size:18px}
  .mast .wkstrip{order:3;width:100%;padding:14px 0 0}
  .mast .wkstrip{max-width:none}
  .save{max-width:1180px;margin-left:auto;margin-right:auto}
  .pg{padding:20px 28px 0;max-width:1236px}
  .cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}
  .cols.wide{grid-template-columns:2fr 3fr}
  .cols.lead{grid-template-columns:3fr 2fr}
  .cols .col>.card:last-child,.cols .col>.board:last-child{margin-bottom:0}
  .card,.board{margin-bottom:18px}
  .nav{top:0;bottom:0;right:auto;width:236px;background:linear-gradient(180deg,#143A8F 0%,#0B2265 45%,#08194C 100%);box-shadow:none;border-right:1px solid rgba(255,255,255,.08)}
  .nav .in{flex-direction:column;align-items:stretch;padding:20px 14px;height:100%;max-width:none}
  .nav .brand{display:flex;flex-direction:column;gap:8px;padding:4px 10px 26px}
  .nav .brand img{height:34px;width:auto;align-self:flex-start;filter:drop-shadow(0 1px 0 rgba(0,0,0,.25))}
  .nav .brand .lg{font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.7)}
  .nav button{flex:none;flex-direction:row;justify-content:flex-start;gap:12px;padding:11px 14px;border-radius:12px;font-size:14.5px;font-weight:600;letter-spacing:0;color:rgba(255,255,255,.7);transition:background .15s,color .15s}
  .nav button:hover{background:rgba(255,255,255,.08);color:#fff}
  .nav button.on{background:rgba(255,255,255,.14);color:#fff}
  .nav button.on::before{display:none}
  .nav .dot{left:auto;right:14px;top:50%;transform:translateY(-50%)}
  .nav .spacer{display:block;flex:1}
  .nav .gearbtn{display:flex}
  .composer{left:236px;justify-content:flex-start;padding-left:28px}
  .composer .in{max-width:800px;padding-left:0}
  .toast{left:236px}
  .coachwrap{max-width:800px}
  .sbg{align-items:center;padding:28px 28px 28px 264px}
  .sheet{border-radius:24px;max-height:86vh;max-width:640px;animation:pop .22s cubic-bezier(.2,.8,.2,1)}
  @keyframes pop{from{transform:translateY(14px) scale(.985);opacity:0}to{transform:none;opacity:1}}
  .sheet.closing{animation:fadeOut .16s ease-in forwards}
  .grab{display:none}
  .prow.tap:hover,.rowhit:hover{background:var(--press)}
  .btn:hover{filter:brightness(.96)}
  .btn.pri:hover{filter:brightness(1.12)}
  .chip:hover:not(.on):not(.static){border-color:var(--ink3)}
  .wkc:hover:not(.on){background:rgba(255,255,255,.2)}
  .act:hover{background:var(--press)}
  .sg:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(11,34,101,.12)}
  .iconb:hover{background:var(--press)}
  .val .n{font-size:24px}
}
@media (min-width:1280px){
  .cols{gap:22px}
}
.srch{padding:6px 16px 8px}
.morebtn{width:100%;border-top:1px solid var(--rule);padding:14px;font-weight:800;color:var(--info)}
.iconb{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;color:var(--ink3);flex:none;border:1.5px solid transparent}
.iconb.on{color:#fff;background:var(--red)}
.iconb.add{border-color:var(--rule2);color:var(--ink)}
.iconb:active{background:var(--press)}
`;

// =============================================================================
// PRIMITIVES
// =============================================================================
function Sheet({ title, sub, onClose, children }) {
  const [closing, setClosing] = useState(false); const timer = useRef(null);
  const close = useCallback(() => { if (REDUCE) { onClose(); return; } setClosing(true); timer.current = setTimeout(onClose, 200); }, [onClose]);
  useEffect(() => { if (timer.current) { clearTimeout(timer.current); timer.current = null; } setClosing(false); return () => { if (timer.current) clearTimeout(timer.current); }; }, [title]);
  useEffect(() => { const f = (e) => { if (e.key === "Escape") close(); }; window.addEventListener("keydown", f); return () => window.removeEventListener("keydown", f); }, [close]);
  return (
    <div className={"sbg" + (closing ? " closing" : "")} onClick={close}>
      <div className={"sheet" + (closing ? " closing" : "")} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="sh"><div style={{ minWidth: 0 }}><div className="t cond">{title}</div>{sub && <div className="s">{sub}</div>}</div><button className="x" onClick={close} aria-label="Close">✕</button></div>
        <div className="sb">{children}</div>
      </div>
    </div>
  );
}
const POS_MAX = {}; POOL.forEach((p) => { if (p.pw != null && (POS_MAX[p.p] || 0) < p.pw) POS_MAX[p.p] = p.pw; });
function Badge({ p, slot, empty }) {
  if (empty) return <span className="badge empty cond">{slot}</span>;
  if (!p) return <span className="badge slot cond">{slot}</span>;
  const st = TEAM_STYLE[p.t] || { bg: "#5A657D", line: "#C9D0DF", text: "#FFFFFF" };
  return (
    <span className={"badge cond" + (slot === "FLEX" ? " isflex" : "")}>
      <span className="bx" style={{ background: st.bg, color: st.text }}>{p.p}<span className="ln" style={{ background: st.line }} /></span>
      {slot === "FLEX" && <span className="flx">Flex</span>}
    </span>
  );
}
function StatusPill({ p }) { if (!p || !p.status || p.status === "ok") return null; return <span className={"pill " + p.status}>{STATUS[p.status].short}</span>; }
function Val({ p, week, label, delta, tier }) {
  const v = week != null ? wkPts(p, week) : pw(p);
  if (!hasProj(p)) return <span className="val na cond"><div className="n">n/a</div>{label && <div className="l">{label}</div>}</span>;
  const pct = POS_MAX[p.p] ? Math.max(4, Math.min(100, (pw(p) / POS_MAX[p.p]) * 100)) : 0;
  const nsrc = week != null ? wkBreakdown(p, week).parts.length : 0;
  const vl = week != null && vegasUsed(p, week) ? "w/ vegas" : week != null && nsrc >= 2 ? `${nsrc} sources` : label;
  return <span className="val cond"><div className="n">{fmt1(v)}</div>{delta != null ? <div className={"d " + (delta >= 0 ? "up" : "dn")}>{signed(delta)}</div> : vl ? <div className={"l" + (vl === "w/ vegas" ? " veg" : "")}>{vl}</div> : null}{tier !== false && <div className="tier"><i style={{ width: pct + "%" }} /></div>}</span>;
}
function Mx({ p, week }) {
  const r = mxRank(p, week); if (r == null) return null;
  if (r >= 23) return <span className="mx soft" title={`${ordinal(r)} ${mxLabel(p)}`}>Soft</span>;
  if (r <= 10) return <span className="mx tough" title={`${ordinal(r)} ${mxLabel(p)}`}>Tough</span>;
  return null;
}
function Ou({ p, week }) {
  if (!vegasFresh(week)) return null; const g = vegasGame(p.t); if (!g || g.total == null) return null;
  if (g.total >= 49) return <span className="mx soft" title="game total">O/U {g.total}</span>;
  if (g.total <= 41) return <span className="mx tough" title="game total">O/U {g.total}</span>;
  return null;
}
function PRow({ p, week, onClick, right, cls, sub, badge, actions, idx }) {
  const m = matchup(p.t, week);
  const style = idx != null ? { animationDelay: `${Math.min(idx, 12) * 35}ms` } : undefined;
  const core = (<>
    {badge || <Badge p={p} />}
    <span>
      <span className="pname"><span className="t">{p.n}</span><StatusPill p={p} /></span>
      <span className="psub">{p.t} {m.bye ? <span className="bye">BYE</span> : <b>{m.text}</b>}<Mx p={p} week={week} /><Ou p={p} week={week} />{sub ? <span>{sub}</span> : null}{p.note ? <span className="muted">{p.note}</span> : null}</span>
    </span>
  </>);
  if (actions) {
    return (
      <div className={"prow acts" + (cls ? " " + cls : "") + (idx != null ? " in" : "")} style={style}>
        {onClick ? <button className="rowhit rowbtn" onClick={onClick}>{core}</button> : <div className="rowhit">{core}</div>}
        <span className="pright">{right}{actions}</span>
      </div>
    );
  }
  const Tag = onClick ? "button" : "div";
  return (
    <Tag className={"prow" + (onClick ? " tap rowbtn" : "") + (cls ? " " + cls : "") + (idx != null ? " in" : "")} style={style} onClick={onClick}>
      {core}
      <span className="pright">{right}</span>
    </Tag>
  );
}
function NavIcon({ name }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home": return <svg viewBox="0 0 24 24" {...c}><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4M8 15h3M13 15h3" /></svg>;
    case "team": return <svg viewBox="0 0 24 24" {...c}><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><circle cx="17.5" cy="9" r="2.5" /><path d="M16 14.2c3 .2 5.5 2.3 5.5 5.3" /></svg>;
    case "wire": return <svg viewBox="0 0 24 24" {...c}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2M11 8v6M8 11h6" /></svg>;
    case "league": return <svg viewBox="0 0 24 24" {...c}><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v3M8 20h8M9 17h6" /></svg>;
    case "coach": return <svg viewBox="0 0 24 24" {...c}><path d="M12 3a8 8 0 0 1 8 8c0 1.9-.7 3.7-1.8 5.1L20 21l-4.8-1.4A8 8 0 1 1 12 3z" /><path d="M9 11h6M9 14h4" /></svg>;
    default: return null;
  }
}

// =============================================================================
// APP
// =============================================================================
export default function App() {
  const [state, setState] = useState(null);
  const [week, setWeek] = useState(currentWeek());
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState(null);
  const [coachPrefill, setCoachPrefill] = useState("");
  const [saveMsg, setSaveMsg] = useState(""); const [saveErr, setSaveErr] = useState(false);
  const [splash, setSplash] = useState("on"); const [hype, setHype] = useState(() => Math.floor(Math.random() * HYPE.length));
  useEffect(() => {
    const fast = REDUCE; const step = fast ? 0 : 800, total = fast ? 900 : 4300;
    const timers = [];
    if (!fast) { for (let i = 1; i <= 4; i++) timers.push(setTimeout(() => setHype((h) => h + 1), step * i)); }
    timers.push(setTimeout(() => setSplash("out"), total)); timers.push(setTimeout(() => setSplash(null), total + 500));
    return () => timers.forEach(clearTimeout);
  }, []);
  useEffect(() => { if (typeof window !== "undefined") window.scrollTo({ top: 0, left: 0, behavior: "auto" }); }, [tab]);
  const [sysDark, setSysDark] = useState(() => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const loaded = useRef(false); const undoRef = useRef(null); const toastTimer = useRef(null); const stripRef = useRef(null);
  useEffect(() => { const el = stripRef.current && stripRef.current.querySelector(".wkc.on"); if (el && el.scrollIntoView) el.scrollIntoView({ inline: "center", block: "nearest" }); }, [week, state]);
  const storeOk = useRef(!!getStore());

  useEffect(() => { (async () => { let s = null; if (storeOk.current) { try { const r = await getStore().get(STORAGE_KEY, false); if (r && r.value) s = JSON.parse(r.value); } catch (e) { /* first run */ } } setState(s && s.roster ? migrate(s) : freshState()); loaded.current = true; })(); }, []);
  useEffect(() => { if (!window.matchMedia) return; const mq = window.matchMedia("(prefers-color-scheme: dark)"); const f = (e) => setSysDark(e.matches); mq.addEventListener ? mq.addEventListener("change", f) : mq.addListener(f); return () => { mq.removeEventListener ? mq.removeEventListener("change", f) : mq.removeListener(f); }; }, []);
  useEffect(() => {
    if (!state || !loaded.current) return;
    if (!storeOk.current) { setSaveMsg("Storage unavailable here, changes will not persist"); setSaveErr(true); return; }
    const t = setTimeout(async () => { try { const r = await getStore().set(STORAGE_KEY, JSON.stringify(state), false); if (!r) throw new Error("no result"); setSaveMsg("Saved " + new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })); setSaveErr(false); } catch (e) { setSaveMsg("Save failed, try again"); setSaveErr(true); } }, 500);
    return () => clearTimeout(t);
  }, [state]);

  const update = useCallback((fn) => setState((s) => fn({ ...s })), []);
  const addLog = (s, text) => ({ ...s, log: [{ t: today(), text }, ...s.log].slice(0, 100) });
  const showToast = (text, undoable) => { if (toastTimer.current) clearTimeout(toastTimer.current); setToast({ text, undoable }); toastTimer.current = setTimeout(() => setToast(null), 6000); };
  const undoable = (fn, text) => { undoRef.current = state; update(fn); showToast(text, true); };
  const undo = () => { if (undoRef.current) { setState(undoRef.current); undoRef.current = null; } setToast(null); };

  // ---- derived ---------------------------------------------------------------
  const settings = state ? state.settings : { theme: "auto", rosterLimit: 17 };
  VEGAS = state ? state.vegas || null : null;
  const [vegasBusy, setVegasBusy] = useState(false); const [vegasErr, setVegasErr] = useState("");
  const ROSTER_LIMIT = settings.rosterLimit || 17;
  const dark = settings.theme === "dark" || (settings.theme === "auto" && sysDark);
  const roster = useMemo(() => (state ? sortRoster(state.roster) : []), [state]);
  const byId = useMemo(() => Object.fromEntries(roster.map((p) => [p.id, p])), [roster]);
  const active = roster.filter((p) => p.status !== "ir"); const irList = roster.filter((p) => p.status === "ir");
  const rec = useMemo(() => recordFromResults(state ? state.results : {}), [state]);
  const owner = useMemo(() => { const o = {}; if (!state) return o; Object.keys(state.teams).forEach((t) => state.teams[t].forEach((id) => { o[id] = t; })); roster.forEach((p) => { o[p.id] = ME; }); return o; }, [state, roster]);
  const freeAgents = useMemo(() => POOL.filter((p) => !owner[p.id]).sort((a, b) => pw(b) - pw(a)), [owner]);
  const savedL = state ? sanitizeLineup(state.lineups[week], byId) : null;
  const autoL = useMemo(() => bestLineup(active, week), [active, week]);
  const lineup = savedL || autoL; const isSaved = !!savedL;
  const myTotal = lineupTotal(lineup, byId, week), autoTotal = lineupTotal(autoL, byId, week);
  const starterIds = new Set(Object.values(lineup).filter(Boolean));
  const bench = active.filter((p) => !starterIds.has(p.id));
  const oppName = MY_SCHEDULE[week] || "";
  const oppIds = state && state.teams[oppName] ? state.teams[oppName] : null;
  const opp = useMemo(() => { if (!oppIds) return null; const players = oppIds.map((id) => POOL_BY_ID[id]).filter(Boolean); const b = Object.fromEntries(players.map((p) => [p.id, p])); const L = bestLineup(players, week); return { players, byId: b, L, total: lineupTotal(L, b, week), onBye: players.filter((p) => matchup(p.t, week).bye) }; }, [oppIds, week]);
  const power = useMemo(() => { if (!state) return []; return LEAGUE_TEAMS.map((t) => { const ids = t === ME ? active.map((p) => p.id) : state.teams[t]; const s = teamStrength(ids); return { team: t, ...s }; }).sort((a, b) => b.total - a.total).map((r, i) => ({ ...r, rank: i + 1 })); }, [state, active]);
  const myRank = power.find((r) => r.team === ME);
  const worstAt = useMemo(() => { const w = {}; POS_LIST.forEach((g) => { const m = active.filter((p) => p.p === g); w[g] = m.length ? Math.min(...m.map(pw)) : 0; }); return w; }, [active]);
  const upgrades = useMemo(() => {
    const out = []; const L = bestLineup(active, NEUTRAL_WEEK, true);
    POS_LIST.forEach((g) => { const st = SLOTS.filter((s) => s.elig.length === 1 && s.elig[0] === g).map((s) => (L[s.k] ? byId[L[s.k]] : null)); const weakest = st.length ? Math.min(...st.map((p) => (p ? pw(p) : 0))) : 0; const weakP = st.find((p) => (p ? pw(p) : 0) === weakest) || null; const fa = freeAgents.find((p) => p.p === g && hasProj(p)); if (fa && pw(fa) > weakest + 0.5) out.push({ pos: g, fa, over: weakP, gain: pw(fa) - weakest }); });
    return out.sort((a, b) => b.gain - a.gain);
  }, [freeAgents, active, byId]);

  // ---- action list --------------------------------------------------------------
  const actions = useMemo(() => {
    const a = [];
    SLOTS.forEach((s) => {
      const id = lineup[s.k]; if (!id) { a.push({ lvl: "bad", text: `${s.label} slot is empty`, sub: "Tap to pick someone", go: "Fill", do: () => setSheet({ type: "slot", slot: s.k }) }); return; }
      const p = byId[id]; if (!p) return;
      if (matchup(p.t, week).bye) a.push({ lvl: "bad", text: `${p.n} is on bye`, sub: `Still in your ${s.label} slot`, go: "Swap", do: () => setSheet({ type: "slot", slot: s.k }) });
      else if (p.status === "o") a.push({ lvl: "bad", text: `${p.n} is out`, sub: `Still in your ${s.label} slot`, go: "Swap", do: () => setSheet({ type: "slot", slot: s.k }) });
      else if (p.status === "d") a.push({ lvl: "bad", text: `${p.n} is doubtful`, sub: `${s.label} slot, find a backup plan`, go: "Swap", do: () => setSheet({ type: "slot", slot: s.k }) });
      else if (p.status === "q") a.push({ lvl: "warn", text: `${p.n} is questionable`, sub: `${s.label} slot, check the Sunday report`, go: "Options", do: () => setSheet({ type: "slot", slot: s.k }) });
    });
    if (isSaved && autoTotal - myTotal >= 1) a.push({ lvl: "warn", text: `Projections like a different lineup by ${fmt1(autoTotal - myTotal)}`, sub: "Blend of Fantasy Index and Footballguys", go: "Compare", do: () => setSheet({ type: "compare" }) });
    if (!isSaved && week >= currentWeek()) a.push({ lvl: "info", text: "Lineup is on auto", sub: `Projected best, ${fmt1(myTotal)} pts. Lock it in once you have read the news.`, go: "Lock in", do: () => { autoFill(); showToast(`Week ${week} lineup set.`); } });
    if (upgrades.length) a.push({ lvl: "info", text: `${upgrades[0].fa.n} is on the wire`, sub: `${upgrades[0].fa.p}, projects ${signed(upgrades[0].gain)} over ${upgrades[0].over ? lastName(upgrades[0].over.n) : "an empty slot"}`, go: "Look", do: () => setSheet({ type: "player", id: upgrades[0].fa.id }) });
    if (active.length > ROSTER_LIMIT) a.push({ lvl: "bad", text: `Roster over the limit (${active.length} of ${ROSTER_LIMIT})`, sub: "Yahoo will not let this stand", go: "Fix", do: () => setTab("team") });
    if (irList.length > IR_LIMIT) a.push({ lvl: "bad", text: `Too many on IR (${irList.length})`, sub: `League allows ${IR_LIMIT}`, go: "Fix", do: () => setTab("team") });
    const nxt = week + 1; if (nxt <= REG_WEEKS) { const onBye = active.filter((p) => matchup(p.t, nxt).bye); if (onBye.length >= 4) a.push({ lvl: "warn", text: `${onBye.length} of your guys are on bye next week`, sub: `Week ${nxt}: ${onBye.map((p) => lastName(p.n)).join(", ")}`, go: "Byes", do: () => setTab("team") }); }
    return a;
  }, [lineup, byId, week, active, irList, isSaved, autoTotal, myTotal, upgrades, ROSTER_LIMIT]);

  // ---- actions -----------------------------------------------------------------------
  const stripFromLineups = (lineups, id) => { const out = {}; Object.keys(lineups).forEach((w) => { const L = { ...lineups[w] }; Object.keys(L).forEach((k) => { if (L[k] === id) L[k] = null; }); out[w] = L; }); return out; };
  const setSlot = (slotKey, id) => update((s) => { const L = { ...lineup }; if (id) { const other = Object.keys(L).find((k) => L[k] === id && k !== slotKey); const displaced = L[slotKey]; L[slotKey] = id; if (other) { const o = SLOTS.find((x) => x.k === other); const dp = displaced ? byId[displaced] : null; L[other] = dp && o.elig.includes(dp.p) ? displaced : null; } } else L[slotKey] = null; return { ...s, lineups: { ...s.lineups, [week]: L } }; });
  const autoFill = () => update((s) => ({ ...s, lineups: { ...s.lineups, [week]: bestLineup(sortRoster(s.roster).filter((p) => p.status !== "ir"), week) } }));
  const resetAuto = () => update((s) => { const l = { ...s.lineups }; delete l[week]; return { ...s, lineups: l }; });
  const setResult = (w, field, val) => update((s) => ({ ...s, results: { ...s.results, [w]: { my: "", opp: "", ...(s.results[w] || {}), [field]: val } } }));
  const setStatus = (id, status) => update((s) => { const p = s.roster.find((x) => x.id === id); let ns = { ...s, roster: s.roster.map((x) => (x.id === id ? { ...x, status } : x)) }; if (p && status === "ir" && p.status !== "ir") ns = addLog(ns, `Moved ${p.n} to IR.`); if (p && p.status === "ir" && status !== "ir") ns = addLog(ns, `Activated ${p.n} from IR.`); return ns; });
  const setNote = (id, note) => update((s) => ({ ...s, roster: s.roster.map((p) => (p.id === id ? { ...p, note } : p)) }));
  const dropPlayer = (id) => { const p = byId[id]; undoable((s) => addLog({ ...s, roster: s.roster.filter((x) => x.id !== id), lineups: stripFromLineups(s.lineups, id) }, `Dropped ${p ? p.n : "a player"}.`), `Dropped ${p ? p.n : "player"}.`); };
  const addPlayer = (pl, dropId) => { const dropped = dropId ? byId[dropId] : null; undoable((s) => { let ns = { ...s }; if (dropId) ns = { ...ns, roster: ns.roster.filter((x) => x.id !== dropId), lineups: stripFromLineups(ns.lineups, dropId) }; ns = { ...ns, roster: [...ns.roster, { ...(POOL_BY_ID[pl.id] || pl), status: "ok", note: "", via: "Waivers" }], watch: ns.watch.filter((w) => w.id !== pl.id) }; return addLog(ns, dropped ? `Added ${pl.n}, dropped ${dropped.n}.` : `Added ${pl.n}.`); }, dropped ? `Added ${pl.n}, dropped ${dropped.n}.` : `Added ${pl.n}.`); };
  const toggleWatch = (pl) => update((s) => { const has = s.watch.some((w) => w.id === pl.id); return { ...s, watch: has ? s.watch.filter((w) => w.id !== pl.id) : [...s.watch, { ...(POOL_BY_ID[pl.id] || pl), note: "" }] }; });
  const setWatchNote = (id, note) => update((s) => ({ ...s, watch: s.watch.map((w) => (w.id === id ? { ...w, note } : w)) }));
  const setNotes = (notes) => update((s) => ({ ...s, notes }));
  const setChat = (fn) => update((s) => ({ ...s, chat: fn(s.chat) }));
  const setSettings = (patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  const teamAdd = (team, pl) => undoable((s) => addLog({ ...s, teams: { ...s.teams, [team]: [...s.teams[team].filter((x) => x !== pl.id), pl.id] }, watch: s.watch.filter((w) => w.id !== pl.id) }, `${team} added ${pl.n}.`), `${team} added ${pl.n}.`);
  const teamDrop = (team, id) => { const p = POOL_BY_ID[id]; undoable((s) => addLog({ ...s, teams: { ...s.teams, [team]: s.teams[team].filter((x) => x !== id) } }, `${team} dropped ${p ? p.n : id}.`), `${team} dropped ${p ? p.n : "player"}.`); };
  const executeTrade = (team, giveIds, getIds) => { const give = roster.filter((p) => giveIds.includes(p.id)); const get = getIds.map((id) => POOL_BY_ID[id]); undoable((s) => { let lineups = s.lineups; giveIds.forEach((id) => { lineups = stripFromLineups(lineups, id); }); const ns = { ...s, roster: [...s.roster.filter((p) => !giveIds.includes(p.id)), ...get.map((p) => ({ ...p, status: "ok", note: "", via: `Trade with ${team}` }))], lineups, teams: { ...s.teams, [team]: [...s.teams[team].filter((id) => !getIds.includes(id)), ...giveIds] } }; return addLog(ns, `Trade with ${team}: got ${get.map((p) => p.n).join(", ")} for ${give.map((p) => p.n).join(", ")}.`); }, `Trade logged with ${team}.`); };
  const resetAll = () => { setState(freshState()); setSheet(null); showToast("Back to draft day, plus the Sept 7 moves."); };
  const importJSON = (txt) => { try { const s = JSON.parse(txt); if (!s.roster || !Array.isArray(s.roster)) throw new Error("bad"); setState(migrate(s)); setSheet(null); showToast("Backup restored."); return true; } catch (e) { return false; } };
  const askCoach = (text) => { setCoachPrefill(text); setSheet(null); setTab("coach"); };
  const applyMoves = (moves) => update((s0) => {
    let ns = { ...s0, roster: [...s0.roster], teams: { ...s0.teams }, txSeen: [...(s0.txSeen || [])] };
    let applied = 0;
    const strip = (lineups, id) => { const out = {}; Object.keys(lineups).forEach((w) => { const L = { ...lineups[w] }; Object.keys(L).forEach((k) => { if (L[k] === id) L[k] = null; }); out[w] = L; }); return out; };
    const removeEverywhere = (id) => { ns.roster = ns.roster.filter((p) => p.id !== id); Object.keys(ns.teams).forEach((t) => { ns.teams[t] = ns.teams[t].filter((x) => x !== id); }); ns.lineups = strip(ns.lineups || {}, id); };
    const giveTo = (team, pl, via) => { removeEverywhere(pl.id); if (team === ME) ns.roster.push({ ...(POOL_BY_ID[pl.id] || pl), status: "ok", note: "", via }); else if (ns.teams[team]) ns.teams[team] = [...ns.teams[team], pl.id]; };
    moves.slice().reverse().forEach((m) => {
      if (!m.team || ns.txSeen.includes(m.key)) return;
      if (m.act === "add") giveTo(m.team, m.player, "Waivers");
      else if (m.act === "drop") removeEverywhere(m.player.id);
      else if (m.act === "trade") giveTo(m.team, m.player, "Trade");
      ns.txSeen.push(m.key); applied++;
      ns.log = [{ t: m.date || today(), text: `${m.team === ME ? "You" : m.team} ${m.act === "add" ? "added" : m.act === "drop" ? "dropped" : "received via trade"} ${m.player.n}.` }, ...ns.log].slice(0, 120);
      ns.watch = ns.watch.filter((w) => w.id !== m.player.id);
    });
    showToast(applied ? `Logged ${applied} move${applied > 1 ? "s" : ""} from Yahoo.` : "Nothing new to log.");
    return ns;
  });
  const apiBase = WEB ? "" : (settings.apiBase || DEFAULT_API).replace(/\/$/, "");
  const pullVegas = async (force) => {
    if (vegasBusy) return;
    if (!force && state.vegas && state.vegas.week === week && Date.now() - state.vegas.at < 4 * 3600e3) { showToast("Lines are less than four hours old. Hold to force a refresh."); return; }
    setVegasBusy(true); setVegasErr("");
    try {
      const r = await fetch(`${apiBase}/api/vegas?props=1`, { headers: { Accept: "application/json" } });
      if (!r.ok) throw new Error(`lines server answered ${r.status}`);
      const j = await r.json(); if (j.error) throw new Error(j.error);
      update((s) => ({ ...s, vegas: { at: j.at || Date.now(), week, games: j.games || [], props: j.props || {}, credits: j.credits || null } }));
      showToast(`Vegas updated: ${(j.games || []).length} games, ${Object.keys(j.props || {}).length} players with props.`);
    } catch (e) {
      const msg = /Failed to fetch|NetworkError|blocked|CORS/i.test(e.message) ? (WEB ? "Could not reach the lines server. Check the connection and try again." : "This view cannot reach the lines server. Open the web version to pull Vegas lines.") : e.message;
      setVegasErr(msg); showToast("Could not pull lines.");
    } finally { setVegasBusy(false); }
  };
  const openPlayer = (id) => setSheet({ type: "player", id });

  const splashEl = splash ? (
    <div className={"splash" + (splash === "out" ? " out" : "")} aria-hidden="true">
      <div className="field"><div className="glow" /><div className="rail l" /><div className="rail r" /><div className="goal" /><div className="sheen" /></div>
      <img src={LOGO} alt="" />
      <div className="rule" />
      <div className="hype"><span key={hype}>{HYPE[hype % HYPE.length]}</span></div>
      <div className="sub">Hogg Heaven 2026</div>
    </div>) : null;
  if (!state) return (<div className="dd"><style>{CSS}</style>{splashEl}<div className="mast"><div className="bar"><div className="wm"><img className="logo" src={LOGO} alt="DIMES" /><span className="lg">Opening the war room</span></div></div></div></div>);

  const resThis = state.results[week] || { my: "", opp: "" };
  const todoCount = actions.filter((a) => a.lvl === "bad").length;

  return (
    <div className={"dd" + (dark ? " dark" : "")}>
      <style>{CSS}</style>
      {splashEl}
      <header className="mast">
        <div className="bar">
          <div className="wm"><img className="logo" src={settings.logo || LOGO} alt="DIMES" /><span className="lg">Hogg Heaven</span></div>
          <div className="rec"><span className="n cond">{fmtRecord(rec)}</span><span className="s">{rec.streak ? `${rec.streak} streak` : myRank ? `Proj #${myRank.rank} of 14` : ""}</span></div>
          <button className="ibtn" onClick={() => setSheet({ type: "menu" })} aria-label="Settings and data"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg></button>
        </div>
        <div className="wkstrip" role="tablist" aria-label="Weeks" ref={stripRef}>
          {Array.from({ length: MAX_WEEK }, (_, i) => i + 1).map((w) => { const r = weekResult(state.results, w); return (
            <button key={w} className={"wkc" + (w === week ? " on" : "") + (w === currentWeek() ? " now" : "") + (w > REG_WEEKS ? " po" : "")} onClick={() => setWeek(w)} role="tab" aria-selected={w === week} aria-label={`Week ${w}`}>
              <span className="w cond">{w}</span><span className={"r " + r} />
            </button>); })}
        </div>
        <div className="wkline"><span className="d"><b className="cond">WEEK {week}</b>{weekSunday(week)}</span><span className="o">{week <= REG_WEEKS && <small>vs</small>}{oppName}{week === RIVALRY_WEEK && <span className="riv">Rivalry</span>}</span></div>
      </header>
      <div className={"save" + (saveErr ? " err" : "")}>{saveMsg}</div>

      <main className="pg view" key={tab}>
        {tab === "home" && <HomeView week={week} actions={actions} lineup={lineup} isSaved={isSaved} byId={byId} bench={bench} irList={irList} myTotal={myTotal} opp={opp} oppName={oppName} res={resThis} vegas={state.vegas} vegasBusy={vegasBusy} vegasErr={vegasErr} onVegas={pullVegas} apiBase={apiBase}
          onResult={(f, v) => setResult(week, f, v)} onSlot={(k) => setSheet({ type: "slot", slot: k })} onAuto={() => { autoFill(); showToast(`Week ${week} set to projected best.`); }} onResetAuto={resetAuto} onPlayer={openPlayer}
          onCoach={() => askCoach(`Set my best Week ${week} lineup vs ${oppName}. Check injury news first.`)} onTeam={() => oppIds && setSheet({ type: "team", team: oppName })} />}
        {tab === "team" && <TeamView roster={roster} active={active} irList={irList} week={week} myRank={myRank} rec={rec} results={state.results} log={state.log} notes={state.notes} limit={ROSTER_LIMIT} onPlayer={openPlayer} onAdd={() => setSheet({ type: "add" })} onImport={() => setSheet({ type: "import" })} onNotes={setNotes} />}
        {tab === "wire" && <WireView week={week} freeAgents={freeAgents} upgrades={upgrades} worstAt={worstAt} watch={state.watch} onWatch={toggleWatch} onAdd={(pl) => setSheet({ type: "add", pick: pl })} onPlayer={openPlayer} />}
        {tab === "league" && <LeagueView power={power} onTeam={(t) => setSheet({ type: "team", team: t })} onPlayer={openPlayer} />}
        {tab === "coach" && <CoachView state={state} week={week} lineup={lineup} byId={byId} bench={bench} irList={irList} rec={rec} opp={opp} oppName={oppName} power={power} freeAgents={freeAgents} prefill={coachPrefill} clearPrefill={() => setCoachPrefill("")} setChat={setChat} />}
      </main>

      <nav className="nav" aria-label="Sections"><div className="in">
        <div className="brand"><img src={settings.logo || LOGO} alt="DIMES" /><span className="lg">Hogg Heaven 2026</span></div>
        {[["home", "Home"], ["team", "Team"], ["wire", "Wire"], ["league", "League"], ["coach", "Coach"]].map(([k, l]) => (
          <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)} aria-current={tab === k ? "page" : undefined}>{k === "home" && todoCount > 0 && <span className="dot" />}<NavIcon name={k} />{l}</button>))}
        <div className="spacer" />
        <button className="gearbtn" onClick={() => setSheet({ type: "menu" })}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>Settings</button>
      </div></nav>

      {toast && <div className="toast"><div className="in"><span>{toast.text}</span>{toast.undoable && <button onClick={undo}>Undo</button>}</div></div>}

      {sheet && sheet.type === "slot" && <SlotSheet slotKey={sheet.slot} lineup={lineup} roster={active} week={week} byId={byId} onPick={(id) => { setSlot(sheet.slot, id); setSheet(null); }} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === "compare" && <CompareSheet lineup={lineup} autoL={autoL} byId={byId} week={week} myTotal={myTotal} autoTotal={autoTotal} onApply={() => { autoFill(); setSheet(null); showToast("Lineup updated."); }} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === "player" && <PlayerSheet id={sheet.id} p={byId[sheet.id] || POOL_BY_ID[sheet.id]} mine={!!byId[sheet.id]} ownerName={owner[sheet.id]} week={week} irCount={irList.length} watched={state.watch.some((w) => w.id === sheet.id)}
        onStatus={(st) => setStatus(sheet.id, st)} onNote={(n) => setNote(sheet.id, n)} onDrop={() => { dropPlayer(sheet.id); setSheet(null); }} onAdd={() => setSheet({ type: "add", pick: POOL_BY_ID[sheet.id] })} onWatch={() => toggleWatch(POOL_BY_ID[sheet.id])}
        onTrade={() => setSheet({ type: "trade", team: owner[sheet.id], want: sheet.id })} onAsk={askCoach} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === "add" && <AddSheet pick={sheet.pick} active={active} week={week} owner={owner} limit={ROSTER_LIMIT} onAdd={(pl, dropId) => { addPlayer(pl, dropId); setSheet(null); }} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === "team" && state.teams[sheet.team] && <TeamSheet team={sheet.team} ids={state.teams[sheet.team]} week={week} power={power} freeAgents={freeAgents} onTrade={() => setSheet({ type: "trade", team: sheet.team })} onAdd={(pl) => teamAdd(sheet.team, pl)} onDrop={(id) => teamDrop(sheet.team, id)} onPlayer={openPlayer} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === "trade" && state.teams[sheet.team] && <TradeSheet team={sheet.team} theirIds={state.teams[sheet.team]} active={active} want={sheet.want} limit={ROSTER_LIMIT} onExecute={(give, get) => { executeTrade(sheet.team, give, get); setSheet(null); }} onAsk={askCoach} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === "import" && <ImportSheet seen={state.txSeen || []} onApply={(mv) => { applyMoves(mv); setSheet(null); }} onClose={() => setSheet(null)} />}
      {sheet && sheet.type === "menu" && <MenuSheet state={state} settings={settings} onSettings={setSettings} onReset={resetAll} onImport={importJSON} onClose={() => setSheet(null)} />}
    </div>
  );
}

// =============================================================================
// HOME
// =============================================================================
function VegasCard({ week, vegas, busy, err, onPull, lineup, byId, apiBase }) {
  const fresh = vegasFresh(week);
  const teams = new Set(); SLOTS.forEach((s) => { const p = lineup[s.k] ? byId[lineup[s.k]] : null; if (p) teams.add(p.t); });
  const games = fresh ? vegas.games.filter((g) => teams.has(g.home) || teams.has(g.away)).sort((a, b) => (b.total || 0) - (a.total || 0)) : [];
  const age = vegas && vegas.at ? Math.round((Date.now() - vegas.at) / 3600e3) : null;
  const propsN = vegas && vegas.props ? Object.keys(vegas.props).length : 0;
  return (
    <section className="card">
      <div className="ch"><h2 className="cond">Vegas board</h2><span className="aux">{fresh ? `${age < 1 ? "under an hour" : age + "h"} old, ${propsN} props` : vegas && vegas.week !== week ? `Week ${vegas.week} lines loaded` : "not pulled yet"}</span></div>
      {err && <div className="hint" style={{ color: "var(--stop)", paddingTop: 0 }}>{err}{!WEB && <> <a href={apiBase} target="_blank" rel="noreferrer" style={{ color: "var(--info)", fontWeight: 700 }}>Open web version</a></>}</div>}
      {!fresh && !err && <div className="hint" style={{ paddingTop: 0 }}>Pull this week's totals, spreads and player props from the books. Props post Tuesday to Thursday. Once props are in, Vegas joins the weekly blend at the heaviest weight.</div>}
      {fresh && games.length === 0 && <div className="empty">No lines for your starters' games in this window.</div>}
      {fresh && games.map((g) => { const hot = g.total != null && g.total >= 49, cold = g.total != null && g.total <= 41; const fav = g.spreadHome != null ? (g.spreadHome < 0 ? `${g.home} ${g.spreadHome}` : g.spreadHome > 0 ? `${g.away} ${-g.spreadHome}` : "Pick") : ""; return (
        <div key={g.id} className="vg">
          <div className="vgt"><span className="tm cond">{g.away}</span><span className="at">@</span><span className="tm cond">{g.home}</span>{hot && <span className="mx soft">Shootout</span>}{cold && <span className="mx tough">Slog</span>}</div>
          <div className="vgn"><span><b className="cond">{g.total != null ? g.total : "–"}</b><small>O/U</small></span><span><b className="cond">{fav}</b><small>line</small></span><span><b className="cond">{g.impliedAway != null ? `${g.impliedAway} / ${g.impliedHome}` : "–"}</b><small>implied</small></span></div>
        </div>); })}
      <div className="btns"><button className="btn pri" onClick={() => onPull(!fresh)} disabled={busy} onContextMenu={(e) => { e.preventDefault(); onPull(true); }}>{busy ? "Pulling lines" : fresh ? "Refresh lines" : "Pull this week's lines"}</button>{fresh && <button className="btn" onClick={() => onPull(true)} disabled={busy}>Force refresh</button>}</div>
    </section>
  );
}
function HomeView({ week, actions, lineup, isSaved, byId, bench, irList, myTotal, opp, oppName, res, onResult, onSlot, onAuto, onResetAuto, onPlayer, onCoach, onTeam, vegas, vegasBusy, vegasErr, onVegas, apiBase }) {
  const [showOpp, setShowOpp] = useState(false);
  const myT = useTween(myTotal), opT = useTween(opp ? opp.total : 0);
  const my = parseFloat(res.my), op = parseFloat(res.opp); const done = !isNaN(my) && !isNaN(op);
  const result = done ? (my > op ? "W" : my < op ? "L" : "T") : "";
  const tot = myTotal + (opp ? opp.total : 0) || 1; const edge = opp ? myTotal - opp.total : 0;
  return (
    <div className="cols"><div className="col">
      <section className="card">
        <div className="ch"><h2 className="cond">Before kickoff</h2><span className="aux">{actions.length ? `${actions.length} to look at` : ""}</span></div>
        {actions.length === 0 ? <div className="allgood"><span className="ic">✓</span><span>You are set. Nobody on bye, nobody flagged, projections agree with your lineup.</span></div>
          : actions.map((a, i) => <button key={i} className={"act " + a.lvl} style={{ animationDelay: `${i * 45}ms` }} onClick={a.do}><span className="ic cond">{a.lvl === "bad" ? "!" : a.lvl === "warn" ? "?" : "i"}</span><span className="tx">{a.text}<small>{a.sub}</small></span><span className="go">{a.go}</span></button>)}
      </section>

      <section className="board">
        <div className="kick"><span><b>Week {week}</b> projected</span><span>{weekSunday(week)}</span></div>
        <div className="side"><div><div className="who cond">Dimes</div><div className="sub">{isSaved ? "Your lineup" : "Auto lineup"}</div></div><div className="tot cond">{fmt1(myT)}</div></div>
        {opp ? (<>
          <div className="bars"><i className="m" style={{ width: `${(myTotal / tot) * 100}%` }} /><i className="t" style={{ width: `${(opp.total / tot) * 100}%` }} /></div>
          <div className="side"><div><div className="who cond">{oppName}</div><div className="sub">Their best lineup{opp.onBye.length ? `, ${opp.onBye.length} on bye` : ""}</div></div><div className="tot cond">{fmt1(opT)}</div></div>
          <div className="edge">{Math.abs(edge) < 3 ? <span>Coin flip on paper, <b>{fmt1(Math.abs(edge))}</b> apart.</span> : edge > 0 ? <span>You project ahead by <b>{fmt1(edge)}</b>.</span> : <span>They project ahead by <b>{fmt1(-edge)}</b>.</span>}{opp.onBye.length >= 3 && <span> Their bye week is your opening.</span>}</div>
          <div className="btns"><button className="btn sm" onClick={() => setShowOpp((v) => !v)}>{showOpp ? "Hide their lineup" : "Their lineup"}</button><button className="btn sm" onClick={onTeam}>Scout {oppName}</button></div>
          {showOpp && SLOTS.map((s) => { const p = opp.L[s.k] ? opp.byId[opp.L[s.k]] : null; return p ? <PRow key={s.k} p={p} week={week} badge={<Badge slot={s.label} p={p} />} onClick={() => onPlayer(p.id)} right={<Val p={p} week={week} />} /> : <div key={s.k} className="prow dim"><Badge slot={s.label} empty /><span className="pname">Nobody available</span><span /></div>; })}
        </>) : <div className="edge">Playoff opponent is not set yet.</div>}
      </section>

      <VegasCard week={week} vegas={vegas} busy={vegasBusy} err={vegasErr} onPull={onVegas} lineup={lineup} byId={byId} apiBase={apiBase} />
    </div><div className="col">
      <section className="card">
        <div className="ch"><h2 className="cond">Lineup</h2><span className={"pill " + (isSaved ? "set" : "auto")}>{isSaved ? "Set by you" : "Auto"}</span></div>
        {SLOTS.map((s, i) => { const p = lineup[s.k] ? byId[lineup[s.k]] : null; const m = p ? matchup(p.t, week) : null; const warn = p && (m.bye || p.status === "o" || p.status === "d");
          return p ? <PRow key={s.k} p={p} week={week} badge={<Badge slot={s.label} p={p} />} cls={warn ? "warn" : ""} onClick={() => onSlot(s.k)} right={<><Val p={p} week={week} /><span className="chev">›</span></>} idx={i} />
            : <button key={s.k} className="prow tap rowbtn" onClick={() => onSlot(s.k)}><Badge slot={s.label} empty /><span className="pname muted">Empty, tap to fill</span><span className="chev">›</span></button>; })}
        <div className="btns"><button className="btn pri" onClick={onAuto}>Use projected best</button>{isSaved && <button className="btn" onClick={onResetAuto}>Back to auto</button>}<button className="btn" onClick={onCoach}>Ask Coach</button></div>
      </section>

      <section className="card">
        <div className="ch"><h2 className="cond">Final score</h2><span className="aux">{week <= REG_WEEKS ? `vs ${oppName}` : oppName}</span></div>
        <div className="score"><div><label>Dimes</label><input inputMode="decimal" placeholder="0.0" value={res.my} onChange={(e) => onResult("my", e.target.value)} aria-label="My score" /></div><div className={"res cond " + result}>{result || "vs"}</div><div><label>Them</label><input inputMode="decimal" placeholder="0.0" value={res.opp} onChange={(e) => onResult("opp", e.target.value)} aria-label="Opponent score" /></div></div>
      </section>

      <section className="card">
        <div className="ch"><h2 className="cond">Bench</h2><span className="aux">{bench.length} players</span></div>
        {bench.length === 0 && <div className="empty">Everybody is starting.</div>}
        {bench.map((p, i) => <PRow key={p.id} p={p} week={week} onClick={() => onPlayer(p.id)} right={<><Val p={p} week={week} /><span className="chev">›</span></>} idx={i} />)}
        {irList.length > 0 && <><div className="ch" style={{ paddingTop: 12 }}><h2 className="cond" style={{ fontSize: 17 }}>IR</h2></div>{irList.map((p) => <PRow key={p.id} p={p} week={week} onClick={() => onPlayer(p.id)} cls="dim" right={<span className="chev">›</span>} />)}</>}
      </section>
    </div></div>
  );
}

function SlotSheet({ slotKey, lineup, roster, week, byId, onPick, onClose }) {
  const s = SLOTS.find((x) => x.k === slotKey); const curId = lineup[slotKey]; const cur = curId ? byId[curId] : null;
  const inLineup = new Set(Object.values(lineup).filter(Boolean));
  const options = roster.filter((p) => s.elig.includes(p.p) && p.id !== curId).sort((a, b) => wkPts(b, week) - wkPts(a, week));
  return (
    <Sheet title={`${s.label} slot`} sub={cur ? `Now ${cur.n}, ${fmt1(wkPts(cur, week))} projected this week` : "Currently empty"} onClose={onClose}>
      <div className="ssec"><span>Eligible on your roster</span><span>vs current</span></div>
      <div className="card">
        {options.length === 0 && <div className="empty">Nobody else on the roster can play {s.label}. Check the Wire.</div>}
        {options.map((p) => { const m = matchup(p.t, week); return <PRow key={p.id} p={p} week={week} cls={m.bye || p.status === "o" ? "warn" : ""} onClick={() => onPick(p.id)} sub={inLineup.has(p.id) ? "starting elsewhere, will swap" : null} right={<Val p={p} week={week} delta={cur && hasProj(p) ? wkPts(p, week) - wkPts(cur, week) : null} />} />; })}
      </div>
      {cur && <div className="btns"><button className="btn" onClick={() => onPick(null)}>Bench {lastName(cur.n)}, leave it empty</button></div>}
    </Sheet>
  );
}
function CompareSheet({ lineup, autoL, byId, week, myTotal, autoTotal, onApply, onClose }) {
  return (
    <Sheet title="Yours vs projected best" sub={`Yours ${fmt1(myTotal)}, projections ${fmt1(autoTotal)}. Both sources blended 50/50.`} onClose={onClose}>
      <div className="card">
        <div className="cmp"><span className="s cond">Slot</span><span className="n">Yours</span><span className="n">Projected</span></div>
        {SLOTS.map((s) => { const a = lineup[s.k] ? byId[lineup[s.k]] : null; const b = autoL[s.k] ? byId[autoL[s.k]] : null; const diff = (a ? a.id : null) !== (b ? b.id : null); return <div key={s.k} className="cmp"><span className="s cond">{s.label}</span><span>{a ? a.n : "Empty"}<div className="n">{a ? fmt1(wkPts(a, week)) : ""}</div></span><span className={diff ? "better" : ""}>{b ? b.n : "Empty"}<div className="n">{b ? fmt1(wkPts(b, week)) : ""}</div></span></div>; })}
      </div>
      <div className="btns"><button className="btn pri" onClick={onApply}>Use projected best</button><button className="btn" onClick={onClose}>Keep mine</button></div>
      <div className="hint">Projections do not see this week's matchups or late injury news. Trust your read when you have one.</div>
    </Sheet>
  );
}

// =============================================================================
// PLAYER SHEET (mine, free agent, or someone else's)
// =============================================================================
function PlayerSheet({ p, mine, ownerName, week, irCount, watched, onStatus, onNote, onDrop, onAdd, onWatch, onTrade, onAsk, onClose }) {
  if (!p) return null;
  const next = [week, week + 1, week + 2].filter((w) => w <= 18);
  const news = newsFor(p); const flags = (p.fl || "").split("").filter((f) => FLAG_TEXT[f]);
  const isFA = !ownerName; const other = ownerName && ownerName !== ME;
  return (
    <Sheet title={p.n} sub={`${p.p}, ${p.t}, bye ${p.b}. ${isFA ? "Free agent" : other ? `On ${ownerName}` : p.via ? `Yours via ${p.via.toLowerCase()}` : "Yours"}. ADP ${p.a < 300 ? p.a : "undrafted"}.`} onClose={onClose}>
      <div className="hero"><Badge p={p} /><div><div className="big cond">{hasProj(p) ? fmt1(pw(p)) : "n/a"}</div><div className="lab">Points per week, {srcList(p).length ? srcList(p).join(" + ") + " blend" : "no season projection"}</div></div></div>
      <div className="stats" style={{ gridTemplateColumns: "repeat(3,1fr)", paddingTop: 0 }}>
        <div className="stat"><div className="v cond">{p.pwF != null ? fmt1(p.pwF) : "–"}</div><div className="k">Fantasy Index</div></div>
        <div className="stat"><div className="v cond">{p.pwB != null ? fmt1(p.pwB) : "–"}</div><div className="k">Footballguys</div></div>
        <div className="stat"><div className="v cond">{p.pwP != null ? fmt1(p.pwP) : "–"}</div><div className="k">PFF</div></div>
      </div>
      {(() => { const bd = wkBreakdown(p, week); if (!bd.parts.length) return null; const m = matchup(p.t, week); return (
        <div className="card" style={{ marginTop: 4 }}>
          <div className="ch" style={{ paddingBottom: 6 }}><h2 className="cond">This week</h2><span className="aux">{m.bye ? "bye" : `${m.text}, ${fmt1(bd.v)} blended`}</span></div>
          <div className="brk">{bd.parts.map((x) => <div key={x.k}><span className="lab2">{x.label}{x.k === "model" && mxRank(p, week) != null ? <small>{ordinal(mxRank(p, week))} {mxLabel(p)}</small> : null}{x.floor != null ? <small>floor {fmt1(x.floor)}, upside {fmt1(x.up)}</small> : null}</span><b className="cond">{fmt1(x.v)}</b><i style={{ width: `${Math.round((x.w / 1.5) * 100)}%` }} /></div>)}</div>
          <div className="hint" style={{ paddingTop: 2 }}>Weighted blend: Vegas 1.5, Footballguys weekly 1.2, season model 1.0, expert ranks 0.7. Bars show the weight.</div>
        </div>); })()}
      {vegasFresh(week) && vegasProp(p) && (() => { const pr = vegasProp(p); const v = vegasPts(p); const g = vegasGame(p.t); return (
        <div className="card" style={{ marginTop: 4 }}>
          <div className="ch" style={{ paddingBottom: 4 }}><h2 className="cond">Vegas, Week {week}</h2><span className="aux">{g && g.total != null ? `O/U ${g.total}` : ""}</span></div>
          <div className="vp">{[["Pass yds", pr.pass_yds], ["Pass TD", pr.pass_tds], ["Rush yds", pr.rush_yds], ["Rec", pr.rec], ["Rec yds", pr.rec_yds], ["Any TD", pr.atd != null ? Math.round(pr.atd * 100) + "%" : null]].filter((x) => x[1] != null).map(([k, val]) => <span key={k}><b className="cond">{val}</b><small>{k}</small></span>)}</div>
          {v != null && <div className="hint" style={{ paddingTop: 4 }}>Implied <b>{fmt1(v)}</b> half-PPR points from the lines, weighted 1.5 in this week's blend.</div>}
        </div>); })()}
      {hasProj(p) && <div className="srcline">{p.rk != null && <span>FFI rank <b>{p.p}{p.rk}</b></span>}{p.rkB ? <span>FBG rank <b>{p.p}{p.rkB}</b></span> : null}{p.st != null && <span>Starts <b>{p.st} of 17</b></span>}{flags.map((f) => <span key={f} className="pill fl">{FLAG_TEXT[f]}</span>)}</div>}
      {mine && (<div className="field"><label>Status</label><div className="seg">{["ok", "q", "d", "o", "ir"].map((k) => <button key={k} className={p.status === k ? "on" : ""} onClick={() => onStatus(k)} disabled={k === "ir" && p.status !== "ir" && irCount >= IR_LIMIT}>{k === "ok" ? "Healthy" : k === "q" ? "Q" : k === "d" ? "D" : k === "o" ? "Out" : "IR"}</button>)}</div><div className="small muted" style={{ marginTop: 6 }}>{STATUS[p.status || "ok"].label}{irCount >= IR_LIMIT && p.status !== "ir" ? ". IR is full." : ""}</div></div>)}
      <div className="field"><label>Next up</label><div className="chips">{next.map((w) => { const m = matchup(p.t, w); const r = mxRank(p, w); return <span key={w} className={"chip static" + (r != null && r >= 23 ? " soft" : r != null && r <= 10 ? " tough" : "")} style={{ color: m.bye ? "var(--stop)" : undefined }}>Wk {w} {m.text}{r != null ? <small className="rk">{ordinal(r)} {mxLabel(p)}</small> : null}</span>; })}</div></div>
      {mine && <div className="field"><label>Note</label><input value={p.note || ""} onChange={(e) => onNote(e.target.value)} placeholder="Hamstring, limited Wed. Snap share up. Trade bait." /></div>}
      {news.length > 0 && <><div className="ssec"><span>Fantasy Index notes, Sept 7</span></div><div className="card">{news.map((n, i) => <div key={i} className="nitem"><p>{n.x}</p></div>)}</div></>}
      <div className="btns">
        {isFA && <button className={"btn" + (watched ? " pri" : "")} onClick={onWatch}>{watched ? "On watchlist" : "Watch"}</button>}
        {other && <button className="btn pri" onClick={onTrade}>Trade for him</button>}
        <button className="btn" onClick={() => onAsk(`Latest on ${p.n} (${p.p}, ${p.t})?${mine ? ` Should I start him in Week ${week}?` : isFA ? " Worth a waiver claim, and who would I drop?" : ` What would it take to get him from ${ownerName}?`}`)}>Ask Coach</button>

      </div>
    </Sheet>
  );
}

// =============================================================================
// ADD PLAYER
// =============================================================================
function AddSheet({ pick, active, week, owner, limit, onAdd, onClose }) {
  const [q, setQ] = useState(""); const [chosen, setChosen] = useState(pick || null); const [custom, setCustom] = useState(false);
  const [cName, setCName] = useState(""); const [cPos, setCPos] = useState("WR"); const [cTeam, setCTeam] = useState("DAL");
  const needDrop = active.length >= limit;
  const results = useMemo(() => { const s = q.trim().toLowerCase(); if (!s) return []; return POOL.filter((p) => p.n.toLowerCase().includes(s) || p.t.toLowerCase() === s).sort((a, b) => pw(b) - pw(a)).slice(0, 25); }, [q]);
  const makeCustom = () => { const n = cName.trim(); if (!n) return; let id = slug(n) + "-" + cPos.toLowerCase(); if (owner[id] || POOL_BY_ID[id]) id += "-2"; setChosen({ id, n, p: cPos, t: cTeam, b: TEAM_BYE[cTeam], a: 300 }); };
  if (!chosen) return (
    <Sheet title="Log a Yahoo move" sub={needDrop ? "Who did you add? You will pick the drop next." : `Who did you add? ${active.length} of ${limit} spots used.`} onClose={onClose}>
      {!custom ? (<>
        <div className="srch"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or team" /></div>
        {results.length > 0 && <div className="card">{results.map((p) => { const own = owner[p.id]; return <PRow key={p.id} p={p} week={week} cls={own ? "dim" : ""} onClick={() => !own && setChosen(p)} sub={own ? (own === ME ? "already yours" : `on ${own}`) : `bye ${p.b}`} right={own ? <span className="pill own">Taken</span> : <Val p={p} label="per wk" />} />; })}</div>}
        {q && results.length === 0 && <div className="empty">Not in the pool. Add him as a custom player.</div>}
        <div className="btns"><button className="btn" onClick={() => setCustom(true)}>Not listed? Add custom player</button></div>
      </>) : (<>
        <div className="field"><label>Name</label><input autoFocus value={cName} onChange={(e) => setCName(e.target.value)} placeholder="Player name" /></div>
        <div className="field grid2"><div><label>Position</label><select value={cPos} onChange={(e) => setCPos(e.target.value)}>{POS_LIST.map((x) => <option key={x}>{x}</option>)}</select></div><div><label>Team</label><select value={cTeam} onChange={(e) => setCTeam(e.target.value)}>{TEAMS.map((x) => <option key={x}>{x}</option>)}</select></div></div>
        <div className="btns"><button className="btn pri" onClick={makeCustom} disabled={!cName.trim()}>Continue</button><button className="btn" onClick={() => setCustom(false)}>Back</button></div>
      </>)}
    </Sheet>);
  if (!needDrop) return (<Sheet title={`Picked up ${chosen.n}`} sub={`${chosen.p}, ${chosen.t}, bye ${chosen.b}.`} onClose={onClose}><div className="btns"><button className="btn pri" onClick={() => onAdd(chosen, null)}>Log the pickup</button><button className="btn" onClick={() => setChosen(null)}>Pick someone else</button></div></Sheet>);
  const dropOrder = [...active].sort((a, b) => pw(a) - pw(b));
  return (
    <Sheet title={`Picked up ${chosen.n}`} sub="Who did you drop for him?" onClose={onClose}>
      <div className="ssec"><span>Lowest projected first</span></div>
      <div className="card">{dropOrder.map((p) => <PRow key={p.id} p={p} week={week} onClick={() => onAdd(chosen, p.id)} sub={`bye ${p.b}`} right={<><Val p={p} label="per wk" /><span className="pill d">Dropped</span></>} />)}</div>
      <div className="btns"><button className="btn" onClick={() => setChosen(null)}>Back</button></div>
    </Sheet>
  );
}

// =============================================================================
// TEAM
// =============================================================================
function TeamView({ roster, active, irList, week, myRank, rec, results, log, notes, limit, onPlayer, onAdd, onImport, onNotes }) {
  const [openNews, setOpenNews] = useState({});
  const [sec, setSec] = useState("roster");
  const counts = {}; active.forEach((p) => { counts[p.p] = (counts[p.p] || 0) + 1; });
  const news = useMemo(() => { const seen = new Set(); const out = []; roster.forEach((p) => newsFor(p).forEach((n) => { if (!seen.has(n.x)) { seen.add(n.x); out.push({ p, n }); } })); return out; }, [roster]);
  const weeks = Array.from({ length: MAX_WEEK }, (_, i) => i + 1);
  const sosWeeks = Array.from({ length: 6 }, (_, i) => week + i).filter((w) => w <= REG_WEEKS);
  return (
    <>
      <div className="sub-scroll" style={{ padding: "0 0 12px" }}>{[["roster", "Roster"], ["sos", "Matchups"], ["news", `News ${news.length ? `(${news.length})` : ""}`], ["byes", "Byes"], ["season", "Season"], ["notes", "Notes"], ["log", "Moves"]].map(([k, l]) => <button key={k} className={"chip" + (sec === k ? " on" : "")} onClick={() => setSec(k)}>{l}</button>)}</div>

      {sec === "roster" && (<>
        <section className="card">
          <div className="ch"><h2 className="cond">Depth</h2><span className="aux" style={{ color: active.length > limit ? "var(--stop)" : undefined }}>{active.length} of {limit} active, {irList.length} IR</span></div>
          <div className="stats" style={{ gridTemplateColumns: "repeat(6,1fr)", paddingTop: 2, paddingBottom: 8 }}>{POS_LIST.map((g) => <div key={g} className="stat" style={{ padding: "9px 2px 7px" }}><div className="v cond">{counts[g] || 0}</div><div className="k">{g}</div></div>)}</div>
          {myRank && <div className="hint" style={{ paddingTop: 0 }}>Best lineup projects {fmt1(myRank.total)} per week, #{myRank.rank} of 14.</div>}
          <div className="btns" style={{ paddingTop: 0 }}><button className="btn pri" onClick={onImport}>Paste Yahoo transactions</button><button className="btn" onClick={onAdd}>Log one move</button></div>
          <div className="hint" style={{ paddingTop: 0 }}>Moves happen in Yahoo. Copy the league's Transactions page and paste it here to keep rosters, the Wire and the Coach in sync.</div>
        </section>
        <div className="cols"><div className="col">
        {["QB", "RB", "TE"].map((g) => { const list = active.filter((p) => p.p === g); if (!list.length) return null; return (
          <section className="card" key={g}><div className="ch"><h2 className="cond">{g}</h2><span className="aux">{list.length}</span></div>
            {list.map((p) => <PRow key={p.id} p={p} week={week} onClick={() => onPlayer(p.id)} sub={`bye ${p.b}`} right={<><Val p={p} label="per wk" /><span className="chev">›</span></>} />)}</section>); })}
        </div><div className="col">
        {["WR", "K", "DEF"].map((g) => { const list = active.filter((p) => p.p === g); if (!list.length) return null; return (
          <section className="card" key={g}><div className="ch"><h2 className="cond">{g === "DEF" ? "Defense" : g === "K" ? "Kicker" : g}</h2><span className="aux">{list.length}</span></div>
            {list.map((p) => <PRow key={p.id} p={p} week={week} onClick={() => onPlayer(p.id)} sub={`bye ${p.b}`} right={<><Val p={p} label="per wk" /><span className="chev">›</span></>} />)}</section>); })}
        {irList.length > 0 && <section className="card"><div className="ch"><h2 className="cond">Injured reserve</h2><span className="aux">{irList.length} of {IR_LIMIT}</span></div>{irList.map((p) => <PRow key={p.id} p={p} week={week} onClick={() => onPlayer(p.id)} right={<span className="chev">›</span>} />)}</section>}
        </div></div>
      </>)}

      {sec === "sos" && (<section className="card">
        <div className="ch"><h2 className="cond">Matchups ahead</h2><span className="aux">1 tough, 32 soft</span></div>
        <div className="sos"><table>
          <thead><tr><th className="n">Player</th>{sosWeeks.map((w) => <th key={w}>W{w}</th>)}<th>ROS</th></tr></thead>
          <tbody>{active.filter((p) => p.p !== "DEF").map((p) => { const ranks = []; for (let w = week; w <= REG_WEEKS; w++) { const r = mxRank(p, w); if (r != null) ranks.push(r); } const ros = ranks.length ? Math.round(ranks.reduce((a, b) => a + b, 0) / ranks.length) : null; return (
            <tr key={p.id}><td className="n">{lastName(p.n)} <span className="muted small">{p.p}</span></td>
              {sosWeeks.map((w) => { const m = matchup(p.t, w); const r = mxRank(p, w); return m.bye ? <td key={w} className="bye">BYE</td> : <td key={w} style={{ background: sosColor(r) }} title={`${m.text}, ${r != null ? ordinal(r) + " " + mxLabel(p) : ""}`}>{r != null ? r : "–"}</td>; })}
              <td className="ros" style={{ color: ros != null ? sosColor(ros) : undefined }}>{ros != null ? ros : "–"}</td></tr>); })}</tbody>
        </table></div>
        <div className="hint">Opponent defense rank by position from FFI projected yards allowed. Green is soft, red is tough. This-week values in the app already lean up to 10% on these.</div>
      </section>)}

      {sec === "news" && (<section className="card"><div className="ch"><h2 className="cond">News on your guys</h2><span className="aux">Fantasy Index, Sept 7</span></div>
        {news.length === 0 && <div className="empty">Nothing in the Sept 7 notes mentions your roster.</div>}
        {news.map(({ p, n }, i) => <button key={i} className={"nitem" + (openNews[i] ? "" : " clip")} onClick={() => setOpenNews((o) => ({ ...o, [i]: !o[i] }))}><div className="who">{p.n}<span>{p.p} {p.t}</span></div><p>{n.x}</p></button>)}
      </section>)}

      {sec === "byes" && (<section className="card"><div className="ch"><h2 className="cond">Bye week map</h2><span className="aux">current roster</span></div>
        {[5, 6, 7, 8, 9, 10, 11, 13, 14].map((w) => { const out = active.filter((p) => matchup(p.t, w).bye).sort((a, b) => pw(b) - pw(a)); return (
          <div key={w} className="byewk"><div className="w cond">{w}<small>{out.length ? `${out.length} out` : "clear"}</small></div><div><div className={"bar" + (out.length >= 4 ? " hot" : "")}><i style={{ width: Math.min(100, (out.length / 6) * 100) + "%" }} /></div><div className="names">{out.length ? out.map((p, i) => <span key={p.id}>{i > 0 ? ", " : ""}<b>{p.n}</b> <span className="muted small">{p.p}</span></span>) : <span className="muted">Full squad available</span>}</div></div></div>); })}
        <div className="hint">Week 12 has no byes. Plan the Week 11 crunch early: wire pickups should be off teams that play that week.</div>
      </section>)}

      {sec === "season" && (<section className="card">
        <div className="ch"><h2 className="cond">Season</h2><span className="aux">{rec.games} of {REG_WEEKS} played</span></div>
        <div className="stats"><div className="stat"><div className="v cond">{fmtRecord(rec)}</div><div className="k">W-L</div></div><div className="stat"><div className="v cond">{rec.games ? (rec.pf / rec.games).toFixed(1) : "0.0"}</div><div className="k">Avg for</div></div><div className="stat"><div className="v cond">{rec.games ? (rec.pa / rec.games).toFixed(1) : "0.0"}</div><div className="k">Avg against</div></div><div className="stat"><div className="v cond">{rec.streak || "0"}</div><div className="k">Streak</div></div></div>
        {weeks.map((w) => { const r = results[w] || { my: "", opp: "" }; const res = weekResult(results, w); return (
          <div key={w} className="prow" style={{ gridTemplateColumns: "40px 1fr auto" }}><span className={"badge cond" + (w > REG_WEEKS ? " empty" : "")}>{w}</span><span><span className="pname"><span className="t">{MY_SCHEDULE[w]}</span>{w === RIVALRY_WEEK && <span className="pill auto">Rivalry</span>}</span><span className="psub">{weekSunday(w)}{res && <b>{r.my} to {r.opp}</b>}</span></span><span className={"val cond " + (res === "W" ? "" : "")}><div className="n" style={{ color: res === "W" ? "var(--go)" : res === "L" ? "var(--stop)" : "var(--ink3)" }}>{res || "–"}</div></span></div>); })}
        <div className="hint">Enter scores from the Home tab for the selected week.</div>
      </section>)}

      {sec === "notes" && (<section className="card"><div className="ch"><h2 className="cond">Notes</h2></div><div className="cb"><textarea className="notes" value={notes} onChange={(e) => onNotes(e.target.value)} placeholder="Trade ideas, who overpays for RBs, who sets lineups late, waiver order..." /></div></section>)}

      {sec === "log" && (<section className="card"><div className="ch"><h2 className="cond">Moves</h2><button className="btn sm" onClick={onImport}>Paste from Yahoo</button></div><div className="log">{log.length === 0 && <div className="muted">No moves yet.</div>}{log.map((e, i) => <div key={i}><span className="t">{e.t}</span><span>{e.text}</span></div>)}</div></section>)}
    </>
  );
}

// =============================================================================
// WIRE
// =============================================================================
function WireView({ week, freeAgents, upgrades, worstAt, watch, onWatch, onAdd, onPlayer }) {
  const [pos, setPos] = useState("ALL"); const [availOnly, setAvailOnly] = useState(true); const [q, setQ] = useState(""); const [limit, setLimit] = useState(30);
  const watched = new Set(watch.map((w) => w.id));
  const gainOf = (p) => pw(p) - (worstAt[p.p] || 0);
  const list = useMemo(() => { const s = q.trim().toLowerCase(); return freeAgents.filter((p) => pos === "ALL" || p.p === pos).filter((p) => !availOnly || !matchup(p.t, week).bye).filter((p) => !s || p.n.toLowerCase().includes(s) || p.t.toLowerCase().includes(s)).sort((a, b) => gainOf(b) - gainOf(a)); }, [freeAgents, pos, availOnly, q, week, worstAt]);
  const Row = ({ p, note }) => (
    <PRow p={p} week={week} onClick={() => onPlayer(p.id)} sub={note || `bye ${p.b}`} right={<Val p={p} />}
      actions={<><button className={"iconb" + (watched.has(p.id) ? " on" : "")} onClick={() => onWatch(p)} aria-label={watched.has(p.id) ? "Remove from watchlist" : "Add to watchlist"}><svg width="20" height="20" viewBox="0 0 24 24" fill={watched.has(p.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.8l6.1-.7z" /></svg></button></>} />
  );
  return (
    <div className="wire cols wide"><div className="col">
      <section className="card"><div className="ch"><h2 className="cond">Upgrades</h2><span className="aux">beats one of your starters</span></div>
        {upgrades.length === 0 && <div className="empty">No free agent projects above your starters. The wire is for depth right now.</div>}
        {upgrades.map((u) => <Row key={u.fa.id} p={u.fa} note={`${signed(u.gain)} over ${u.over ? lastName(u.over.n) : "empty slot"}`} />)}
      </section>
      <section className="card"><div className="ch"><h2 className="cond">Watchlist</h2><span className="aux">{watch.length ? `${watch.length} tagged` : "star anyone"}</span></div>
        {watch.length === 0 && <div className="empty">Tap the star on anyone you want to keep an eye on.</div>}
        {[...watch].sort((a, b) => pw(b) - pw(a)).map((w) => <Row key={w.id} p={w} note={w.note || `bye ${w.b}`} />)}
      </section>
    </div><div className="col">
      <section className="card"><div className="ch"><h2 className="cond">Free agents</h2><span className="aux">{freeAgents.length} unowned</span></div>
        <div className="cb" style={{ paddingTop: 2 }}><div className="chips" style={{ marginBottom: 8 }}>{["ALL", ...POS_LIST].map((x) => <button key={x} className={"chip" + (pos === x ? " on" : "")} onClick={() => setPos(x)}>{x === "ALL" ? "All" : x}</button>)}<button className={"chip hl" + (availOnly ? " on" : "")} onClick={() => setAvailOnly((v) => !v)}>Plays Wk {week}</button></div><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or team" /></div>
        {list.slice(0, limit).map((p) => { const g = gainOf(p); return <Row key={p.id} p={p} note={hasProj(p) ? `${signed(g)} vs worst ${p.p}` : "no proj"} />; })}
        {list.length === 0 && <div className="empty">Nothing matches. Everyone drafted in Hogg Heaven is filtered out.</div>}
        {list.length > limit && <button className="morebtn" onClick={() => setLimit((l) => l + 30)}>Show {Math.min(30, list.length - limit)} more</button>}
      </section>
    </div></div>
  );
}

// =============================================================================
// LEAGUE
// =============================================================================
function posStrength(r, g) { const st = SLOTS.filter((s) => s.elig.length === 1 && s.elig[0] === g).map((s) => (r.L[s.k] ? pw(r.byId[r.L[s.k]]) : 0)); return st.length ? st.reduce((a, b) => a + b, 0) / st.length : 0; }
function LeagueView({ power, onTeam, onPlayer }) {
  const avg = useMemo(() => { const a = {}; POS_LIST.forEach((g) => { const v = power.map((r) => posStrength(r, g)); a[g] = v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0; }); return a; }, [power]);
  const mine = power.find((r) => r.team === ME);
  const needs = useMemo(() => (mine ? POS_LIST.filter((g) => g !== "K" && g !== "DEF").map((g) => ({ pos: g, mine: posStrength(mine, g), avg: avg[g], gap: posStrength(mine, g) - avg[g] })).sort((a, b) => a.gap - b.gap) : []), [mine, avg]);
  const worst = needs.slice(0, 2);
  const targets = useMemo(() => {
    const out = [];
    worst.forEach((n) => power.filter((r) => r.team !== ME).forEach((r) => r.players.filter((p) => p.p === n.pos && pw(p) > n.mine + 1).forEach((p) => { const slotKey = Object.keys(r.L).find((k) => r.L[k] === p.id); const tier = !slotKey ? 0 : slotKey.startsWith("FLEX") ? 1 : 2; const theirNeed = POS_LIST.filter((g) => g !== "K" && g !== "DEF" && g !== n.pos).map((g) => ({ g, gap: posStrength(r, g) - avg[g] })).sort((a, b) => a.gap - b.gap)[0]; out.push({ p, team: r.team, gain: pw(p) - n.mine, tier, theirNeed }); })));
    return out.sort((a, b) => (a.tier === b.tier ? b.gain - a.gain : a.tier - b.tier)).slice(0, 12);
  }, [power, worst, avg]);
  const maxPos = {}; POS_LIST.forEach((g) => { maxPos[g] = Math.max(1, ...power.map((r) => posStrength(r, g))); });
  return (
    <div className="cols lead"><div className="col">
      <section className="card pr"><div className="ch"><h2 className="cond">Power rankings</h2><span className="aux">best lineup, per week</span></div>
        {power.map((r) => (
          <button key={r.team} className={"prow tap rowbtn" + (r.team === ME ? " mine" : "")} onClick={() => r.team !== ME && onTeam(r.team)}>
            <span className="rk cond">{r.rank}</span>
            <span><span className="pname"><span className="t">{r.team}</span></span><span className="posbars">{["QB", "RB", "WR", "TE"].map((g) => { const v = posStrength(r, g); const d = v - avg[g]; return <span key={g}>{g}<i><b className={d > 0.75 ? "up" : d < -0.75 ? "dn" : ""} style={{ width: `${(v / maxPos[g]) * 100}%` }} /></i></span>; })}</span></span>
            <span className="pright"><span className="val cond"><div className="n">{fmt1(r.total)}</div></span>{r.team !== ME && <span className="chev">›</span>}</span>
          </button>))}
        <div className="hint">Each team's best lineup from the blended Sept 7 projections, byes ignored. Bars are position strength vs the league. Tap a team to scout or build a trade.</div>
      </section>
    </div><div className="col">
      <section className="card"><div className="ch"><h2 className="cond">Where you stand</h2><span className="aux">avg starter vs league</span></div>
        <div className="stats">{needs.slice().sort((a, b) => POS_ORDER[a.pos] - POS_ORDER[b.pos]).map((n) => <div key={n.pos} className="stat"><div className={"v cond " + (n.gap >= 0 ? "up" : "dn")}>{signed(n.gap)}</div><div className="k">{n.pos}, avg {fmt1(n.avg)}</div></div>)}</div>
        <div className="hint" style={{ paddingTop: 0 }}>Biggest gaps: {worst.map((w) => w.pos).join(" and ")}. Targets below run from easiest ask (bench, then FLEX) to hardest (core starters).</div>
      </section>
      <section className="card"><div className="ch"><h2 className="cond">Trade targets</h2><span className="aux">{worst.map((w) => w.pos).join(", ")}</span></div>
        {targets.length === 0 && <div className="empty">Nobody in the league clearly beats your starters at your weak spots.</div>}
        {targets.map((t) => <PRow key={t.p.id + t.team} p={t.p} week={NEUTRAL_WEEK} onClick={() => onPlayer(t.p.id)} sub={`${t.team}${t.tier === 0 ? ", bench" : t.tier === 1 ? ", their FLEX" : ", core starter"}${t.theirNeed && t.theirNeed.gap < -0.5 ? `, thin at ${t.theirNeed.g}` : ""}`} right={<><span className="pill up">{signed(t.gain)}</span><span className="chev">›</span></>} />)}
      </section>
    </div></div>
  );
}
function TeamSheet({ team, ids, week, power, freeAgents, onTrade, onAdd, onDrop, onPlayer, onClose }) {
  const [edit, setEdit] = useState(false); const [q, setQ] = useState("");
  const r = power.find((x) => x.team === team);
  const players = ids.map((id) => POOL_BY_ID[id]).filter(Boolean); const b = Object.fromEntries(players.map((p) => [p.id, p]));
  const L = bestLineup(players, week); const starters = new Set(Object.values(L).filter(Boolean));
  const benchP = players.filter((p) => !starters.has(p.id)).sort((a, b2) => pw(b2) - pw(a));
  const draft = TEAMS_INIT[team] ? TEAMS_INIT[team].d : {};
  const byeCrunch = [5, 6, 7, 8, 9, 10, 11, 13, 14].map((w) => ({ w, n: players.filter((p) => matchup(p.t, w).bye).length })).filter((x) => x.n >= 3);
  const faMatches = q.trim() ? freeAgents.filter((p) => p.n.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8) : [];
  const sub = (p) => draft[p.id] ? `pick ${draft[p.id]}` : "pickup";
  return (
    <Sheet title={team} sub={r ? `#${r.rank} of 14, ${fmt1(r.total)} per week at full strength. ${players.length} rostered.` : ""} onClose={onClose}>
      <div className="btns" style={{ paddingTop: 4 }}><button className="btn pri" onClick={onTrade}>Build a trade</button><button className={"btn" + (edit ? " hl" : "")} onClick={() => setEdit((v) => !v)}>{edit ? "Done" : "Log their move"}</button></div>
      {edit && (<><div className="srch"><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Free agent they picked up" /></div>{faMatches.length > 0 && <div className="card">{faMatches.map((p) => <PRow key={p.id} p={p} week={week} onClick={() => { onAdd(p); setQ(""); }} right={<><Val p={p} label="per wk" /><span className="pill up">Add</span></>} />)}</div>}<div className="hint">Tap Dropped on anyone they cut. This mirrors Yahoo so the Wire stays honest.</div></>)}
      {byeCrunch.length > 0 && <div className="hint">Bye crunches: {byeCrunch.map((x) => `Week ${x.w} (${x.n})`).join(", ")}.</div>}
      <div className="ssec"><span>Best lineup, Week {week}</span><span>{fmt1(lineupTotal(L, b, week))} projected</span></div>
      <div className="card">{SLOTS.map((s) => { const p = L[s.k] ? b[L[s.k]] : null; return p ? <PRow key={s.k} p={p} week={week} badge={<Badge slot={s.label} p={p} />} onClick={() => onPlayer(p.id)} sub={sub(p)} right={<Val p={p} week={week} />} actions={edit ? <button className="btn danger sm" onClick={() => onDrop(p.id)}>Dropped</button> : null} /> : <div key={s.k} className="prow dim"><Badge slot={s.label} empty /><span className="pname">Nobody available</span><span /></div>; })}</div>
      <div className="ssec"><span>Bench</span><span>{benchP.length}</span></div>
      <div className="card">{benchP.map((p) => <PRow key={p.id} p={p} week={week} onClick={() => onPlayer(p.id)} sub={sub(p)} right={<Val p={p} week={week} />} actions={edit ? <button className="btn danger sm" onClick={() => onDrop(p.id)}>Dropped</button> : null} />)}</div>
    </Sheet>
  );
}
function TradeSheet({ team, theirIds, active, want, limit, onExecute, onAsk, onClose }) {
  const [give, setGive] = useState([]); const [get, setGet] = useState(want ? [want] : []);
  const theirs = theirIds.map((id) => POOL_BY_ID[id]).filter(Boolean).sort((a, b) => pw(b) - pw(a)); const mine = [...active].sort((a, b) => pw(b) - pw(a));
  const tg = (list, set, id) => set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  const myBefore = teamStrength(active.map((p) => p.id)).total, myAfter = teamStrength([...active.filter((p) => !give.includes(p.id)).map((p) => p.id), ...get]).total;
  const thBefore = teamStrength(theirIds).total, thAfter = teamStrength([...theirIds.filter((id) => !get.includes(id)), ...give]).total;
  const dMe = myAfter - myBefore, dTh = thAfter - thBefore; const myCount = active.length - give.length + get.length, thCount = theirIds.length - get.length + give.length;
  const ready = give.length > 0 && get.length > 0;
  const summary = () => `Trade idea with ${team}: I give ${give.map((id) => POOL_BY_ID[id] ? POOL_BY_ID[id].n : id).join(", ")} and get ${get.map((id) => POOL_BY_ID[id].n).join(", ")}. Projections say my best lineup goes ${signed(dMe)} per week and theirs ${signed(dTh)}. Good deal? Would they take it?`;
  return (
    <Sheet title={`Trade with ${team}`} sub="Tap players on both sides. Math is best lineup per week, byes ignored." onClose={onClose}>
      {ready && <div className="stats" style={{ gridTemplateColumns: "1fr 1fr", paddingTop: 2 }}><div className="stat"><div className={"delta cond " + (dMe >= 0 ? "up" : "dn")}>{signed(dMe)}</div><div className="k">Dimes per week{myCount > limit ? `, drop ${myCount - limit}` : ""}</div></div><div className="stat"><div className={"delta cond " + (dTh >= 0 ? "up" : "dn")}>{signed(dTh)}</div><div className="k">{team} per week{thCount > limit ? `, they drop ${thCount - limit}` : ""}</div></div></div>}
      {ready && <div className="hint" style={{ paddingTop: 0 }}>{dMe > 0 && dTh > 0 ? "Both sides get better on paper. That is the kind of deal that gets accepted." : dMe > 0 && dTh <= 0 ? "Good for you, not for them. Expect a no unless they value something the projections do not." : dMe <= 0 ? "Projections say you get worse. Only do it if you know something." : ""}</div>}
      <div className="btns" style={{ paddingTop: 0 }}><button className="btn" disabled={!ready} onClick={() => onAsk(summary())}>Ask Coach</button><button className="btn pri" disabled={!ready} onClick={() => onExecute(give, get)}>Log this trade</button></div>
      <div className="tr">
        <div className="ssec"><span>You give</span><span>{give.length}</span></div>
        <div className="card">{mine.map((p) => <button key={p.id} className="prow tap rowbtn" onClick={() => tg(give, setGive, p.id)}><span className={"ck" + (give.includes(p.id) ? " on" : "")}>{give.includes(p.id) ? "✓" : ""}</span><span><span className="pname"><span className="t">{p.n}</span></span><span className="psub">{p.p} {p.t}, bye {p.b}</span></span><span className="pright"><Val p={p} /></span></button>)}</div>
        <div className="ssec"><span>You get</span><span>{get.length}</span></div>
        <div className="card">{theirs.map((p) => <button key={p.id} className="prow tap rowbtn" onClick={() => tg(get, setGet, p.id)}><span className={"ck" + (get.includes(p.id) ? " on" : "")}>{get.includes(p.id) ? "✓" : ""}</span><span><span className="pname"><span className="t">{p.n}</span></span><span className="psub">{p.p} {p.t}, bye {p.b}</span></span><span className="pright"><Val p={p} /></span></button>)}</div>
      </div>
    </Sheet>
  );
}

// =============================================================================
// COACH
// =============================================================================
function buildContext({ state, week, lineup, byId, bench, irList, rec, opp, oppName, power, freeAgents, question }) {
  const L = [];
  const desc = (p, w) => { const bd = wkBreakdown(p, w); return `${p.n} (${p.p} ${p.t}, ${matchup(p.t, w).text}, ${hasProj(p) ? `${fmt1(pw(p))}/wk season [FI ${p.pwF != null ? fmt1(p.pwF) : "-"}, FBG ${p.pwB != null ? fmt1(p.pwB) : "-"}, PFF ${p.pwP != null ? fmt1(p.pwP) : "-"}]` : "no season projection"}, this week ${fmt1(bd.v)} from ${bd.parts.map((x) => `${x.label} ${fmt1(x.v)}`).join(" / ") || "nothing"}`; };
  const descTail = (p) => `${p.fl ? `, flags: ${p.fl.split("").map((f) => FLAG_TEXT[f]).filter(Boolean).join("/")}` : ""}${p.status && p.status !== "ok" ? `, ${STATUS[p.status].label}` : ""}${p.note ? `, note: ${p.note}` : ""})`;
  const descFull = (p, w) => desc(p, w) + descTail(p);
  const mine = power.find((r) => r.team === ME);
  L.push(`Today: ${new Date().toDateString()}. Fantasy Week ${week}. Opponent: ${oppName}${week === RIVALRY_WEEK ? " (Rivalry Week)" : ""}. Record: ${fmtRecord(rec)}${rec.streak ? `, streak ${rec.streak}` : ""}. Power rank by projection: #${mine ? mine.rank : "?"} of 14.`);
  L.push(`League: Hogg Heaven, 14 teams, Yahoo, half-PPR, 4-pt pass TD. Starters: QB, RB, RB, WR, WR, TE, FLEX, FLEX (RB/WR/TE), K, DEF. ${state.settings.rosterLimit} roster spots plus 1 IR. 14-week regular season.`);
  L.push(`Season projections: equal-weight blend of Fantasy Index, Footballguys and PFF (Sept 7). This-week values: weighted blend of Footballguys weekly projections (1.2), season model with matchup adjustment (1.0), Athletic/FantasyPros expert ranks (0.7), and Vegas-implied points (1.5) where available.`);
  L.push(`Matchup difficulty this week (FFI projected yards allowed, 1 = toughest defense, 32 = softest): ${SLOTS.map((s) => { const p = lineup[s.k] ? byId[lineup[s.k]] : null; const r = p ? mxRank(p, week) : null; return p && r != null ? `${lastName(p.n)} ${ordinal(r)} ${mxLabel(p)}` : null; }).filter(Boolean).join("; ")}`);
  L.push(`Donnie's Week ${week} lineup (projected ${fmt1(lineupTotal(lineup, byId, week))}):`);
  SLOTS.forEach((s) => { const p = lineup[s.k] ? byId[lineup[s.k]] : null; L.push(`  ${s.label}: ${p ? descFull(p, week) : "EMPTY"}`); });
  L.push(`Bench: ${bench.map((p) => descFull(p, week)).join("; ") || "none"}`); L.push(`IR: ${irList.map((p) => `${p.n} (${p.p} ${p.t})`).join("; ") || "empty"}`);
  if (opp) { L.push(`${oppName}'s projected best Week ${week} lineup (${fmt1(opp.total)}): ${SLOTS.map((s) => `${s.label} ${opp.L[s.k] ? descFull(opp.byId[opp.L[s.k]], week) : "EMPTY"}`).join("; ")}`); L.push(`${oppName} bench: ${opp.players.filter((p) => !Object.values(opp.L).includes(p.id)).map((p) => `${p.n} (${p.p} ${p.t}, ${fmt1(pw(p))}/wk)`).join("; ")}`); }
  if (vegasFresh(week)) {
    L.push(`Vegas lines this week (consensus of DK/FD/MGM): ${VEGAS.games.map((g) => `${g.away}@${g.home} O/U ${g.total}, home spread ${g.spreadHome}, implied ${g.impliedAway}/${g.impliedHome}`).join("; ")}`);
    const pp = [...SLOTS.map((s) => (lineup[s.k] ? byId[lineup[s.k]] : null)), ...bench].filter(Boolean).map((p) => { const pr = vegasProp(p); if (!pr) return null; const v = vegasPts(p); return `${p.n}: ${["pass_yds", "pass_tds", "rush_yds", "rec", "rec_yds"].filter((k) => pr[k] != null).map((k) => `${k} ${pr[k]}`).join(", ")}${pr.atd != null ? `, anytime TD ${Math.round(pr.atd * 100)}%` : ""}${v != null ? ` = ${fmt1(v)} implied pts` : ""}`; }).filter(Boolean);
    if (pp.length) L.push(`Player props (Vegas): ${pp.join(" | ")}`);
  }
  L.push(`Power rankings (best lineup pts/wk): ${power.map((r) => `${r.rank}. ${r.team} ${fmt1(r.total)}`).join("; ")}`);
  L.push(`All rosters (player, pos team, pts/wk):`); power.forEach((r) => { if (r.team !== ME) L.push(`  ${r.team}: ${[...r.players].sort((a, b) => pw(b) - pw(a)).map((p) => `${p.n} ${p.p} ${p.t} ${fmt1(pw(p))}`).join("; ")}`); });
  L.push(`Top free agents: ${POS_LIST.map((g) => `${g}: ${freeAgents.filter((p) => p.p === g).slice(0, 4).map((p) => `${p.n} ${p.t} ${fmt1(pw(p))}`).join(", ")}`).join(" | ")}`);
  L.push(`Bye weeks on Donnie's roster: ${sortRoster(state.roster).map((p) => `${p.n} ${p.b}`).join(", ")}`);
  if (state.watch.length) L.push(`Watchlist: ${state.watch.map((w) => `${w.n} (${w.p} ${w.t}, ${fmt1(pw(w))}/wk${w.note ? `, ${w.note}` : ""})`).join("; ")}`);
  const upcoming = [week + 1, week + 2].filter((w) => w <= REG_WEEKS).map((w) => `Week ${w} vs ${MY_SCHEDULE[w]}`); if (upcoming.length) L.push(`Upcoming: ${upcoming.join("; ")}`);
  if (state.log.length) L.push(`Recent moves: ${state.log.slice(0, 8).map((e) => `${e.t} ${e.text}`).join(" | ")}`);
  if (state.notes) L.push(`Donnie's notes: ${state.notes.slice(0, 600)}`);
  const seen = new Set(); const items = []; const consider = [...state.roster, ...state.watch]; const q = (question || "").toLowerCase();
  POOL.forEach((p) => { const ln = lastName(p.n).toLowerCase(); if (q && ln.length > 3 && q.includes(ln)) consider.push(p); });
  consider.forEach((p) => newsFor(p).forEach((n) => { if (!seen.has(n.x)) { seen.add(n.x); items.push(`[${p.t}] ${n.x}`); } }));
  let block = ""; for (const it of items) { if (block.length + it.length > 9000) break; block += it + "\n"; }
  if (block) L.push(`Fantasy Index notes, Sept 7 2026 (verify anything time-sensitive):\n${block}`);
  return L.join("\n");
}
const SYSTEM = `You are the assistant GM for Donnie Dimes, Donnie Schemetti's fantasy football team in the Hogg Heaven league. You are talking to Donnie on his phone. He won the 2024 title, went 5-9 in 2025, and wants the ring back.

How to help:
- Decision first, then the reason, in a few short lines. Phone screen, keep it tight.
- Before start/sit, waiver or trade advice, use web search for the latest injury reports, depth chart changes and news on the players involved. Say what you found and when it was reported. If you could not verify something, say so.
- You have every roster in the league. Use them: name specific trade partners, notice who is thin where, and never suggest picking up a player who is on another team.
- Half-PPR with 4-point passing TDs and two FLEX spots, so volume pass catchers and pass-catching RBs get a bump.
- When you set a lineup, list all 10 slots. When you suggest waiver moves, name the add and the drop.
- Projections are a Sept 7 baseline blended from two sources. Weight current news and usage more as the season goes on.
- Talk like a sharp friend who knows the league, not a broadcaster. Plain sentences. No em dashes. No hype.

Format, strictly:
- Open with one bold verdict line, like **Start Dowdle over Henderson.** Then the reasons.
- Lineups: one line per slot, in this exact shape: QB: Josh Allen (vs HOU, 22 proj). Ten lines, nothing else on those lines.
- Waiver moves: lines like "Add: Jerry Jeudy" and "Drop: Chris Brooks".
- Use ### headers for sections when there is more than one topic. Short bullets for reasons. Under 220 words unless asked for depth.

Current league state follows.`;
function IconSvg({ k }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", width: 16, height: 16, viewBox: "0 0 24 24" };
  switch (k) {
    case "lineup": return <svg {...c}><path d="M4 6h16M4 12h10M4 18h7" /></svg>;
    case "injury": return <svg {...c}><path d="M12 4v16M4 12h16" /><circle cx="12" cy="12" r="9" /></svg>;
    case "wire": return <svg {...c}><circle cx="11" cy="11" r="6" /><path d="M20 20l-4.5-4.5" /></svg>;
    case "scout": return <svg {...c}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="2.5" /><path d="M12 4v2M12 18v2M4 12h2M18 12h2" /></svg>;
    case "trade": return <svg {...c}><path d="M4 8h13l-3-3M20 16H7l3 3" /></svg>;
    case "whistle": return <svg {...c} width={22} height={22}><path d="M14 8h-3a6 6 0 1 0 6 6v-3l4-1V8z" /><path d="M11 8V5M15 8V6" /></svg>;
    case "send": return <svg {...c} width={20} height={20}><path d="M5 12h13M13 6l6 6-6 6" /></svg>;
    default: return null;
  }
}
const SLOT_RE = /^\s*\*{0,2}(QB|RB1?|RB2?|WR1?|WR2?|TE|FLEX1?|FLEX2?|K|DEF|D\/ST)\*{0,2}\s*[:\-–]\s*(.+)$/i;
const MOVE_RE = /^\s*\*{0,2}(Add|Drop|Claim|Start|Sit|Bench)\*{0,2}\s*[:\-–]\s*(.+)$/i;
let NAME_RE = null;
function nameRe() { if (!NAME_RE) { const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); const names = POOL.map((p) => p.n).filter((n) => n.length > 5).sort((a, b) => b.length - a.length).map(esc); NAME_RE = new RegExp("(" + names.join("|") + ")"); } return NAME_RE; }
function CoachMd({ text }) {
  const lines = text.split(/\r?\n/);
  const re = nameRe();
  const plain = (t, k) => t.split(re).map((part, i) => (i % 2 === 1 ? <b key={k + "n" + i} className="pn">{part}</b> : part));
  const inline = (t) => t.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith("**") && part.endsWith("**") ? <b key={i}>{part.slice(2, -2)}</b> : plain(part, i)));
  const out = []; let list = null, lu = null, verdictDone = false;
  const flush = () => { if (list) { out.push(<ul key={"l" + out.length}>{list}</ul>); list = null; } if (lu) { out.push(<div key={"lu" + out.length} className="mlu">{lu}</div>); lu = null; } };
  lines.forEach((ln, i) => {
    const raw = ln.trim(); if (!raw) { flush(); return; }
    const sm = raw.replace(/^[-*•]\s+/, "").match(SLOT_RE);
    if (sm) { if (list) { out.push(<ul key={"l" + out.length}>{list}</ul>); list = null; } if (!lu) lu = []; const slot = sm[1].toUpperCase().replace("D/ST", "DEF").replace(/[12]$/, ""); const body = sm[2].replace(/\*\*/g, ""); const par = body.match(/^(.*?)\s*\((.*)\)\s*$/); lu.push(<div key={i}><b className={slot === "FLEX" ? "flex" : ""}>{slot}</b><span className="nm">{par ? par[1] : body}</span>{par ? <small>{par[2]}</small> : <span />}</div>); return; }
    if (lu) { out.push(<div key={"lu" + out.length} className="mlu">{lu}</div>); lu = null; }
    const mv = raw.replace(/^[-*•]\s+/, "").match(MOVE_RE);
    if (mv) { out.push(<div key={i} className={"mv " + (/^(add|claim|start)$/i.test(mv[1]) ? "add" : "drop")}><b>{mv[1]}</b><span>{inline(mv[2].replace(/\*\*/g, ""))}</span></div>); return; }
    const h = raw.match(/^#{1,4}\s+(.*)$/); if (h) { flush(); out.push(<div key={i} className="h">{h[1].replace(/\*\*/g, "")}</div>); return; }
    const bl = raw.match(/^(?:[-*•]|\d+[.)])\s+(.*)$/); if (bl) { if (!list) list = []; list.push(<li key={i}>{inline(bl[1])}</li>); return; }
    flush();
    if (!verdictDone && out.length === 0 && /^\*\*/.test(raw)) { verdictDone = true; out.push(<div key={i} className="verdict">{inline(raw)}</div>); return; }
    out.push(<p key={i}>{inline(raw)}</p>);
  });
  flush();
  return <div className="md">{out}</div>;
}
const THINK = ["Reading the room", "Checking injury reports", "Running the numbers", "Weighing the matchups"];
function CoachView({ state, week, lineup, byId, bench, irList, rec, opp, oppName, power, freeAgents, prefill, clearPrefill, setChat }) {
  const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [tick, setTick] = useState(0); const endRef = useRef(null); const chat = state.chat;
  useEffect(() => { if (prefill) { setInput(prefill); clearPrefill(); } }, [prefill]);
  useEffect(() => { if (endRef.current) endRef.current.scrollIntoView({ block: "end", behavior: REDUCE ? "auto" : "smooth" }); }, [chat.length, busy]);
  useEffect(() => { if (!busy) return; const t = setInterval(() => setTick((x) => x + 1), 1800); return () => clearInterval(t); }, [busy]);
  const sugg = [
    { k: "lineup", t: `Set my Week ${week} lineup`, s: "All 10 slots, news checked", q: `Set my best Week ${week} lineup vs ${oppName}. Check injury news first, then list all 10 slots.` },
    { k: "injury", t: "Injury check", s: "Anyone on my roster", q: "Any injury or role news on my guys since Sept 7? Check the web." },
    { k: "wire", t: "Waiver adds", s: "With the drop", q: "Best waiver adds for me this week, with the drop for each." },
    { k: "scout", t: `Scout ${oppName}`, s: "Where I beat them", q: `Scout ${oppName} for Week ${week}: where do I beat them and where are they exposed?` },
    { k: "trade", t: "Trade ideas", s: "Partners and asks", q: "Who should I trade with, and what should I ask for and offer? Be specific." },
  ];
  const send = async (text) => {
    const t = (text || input).trim(); if (!t || busy) return; setInput("");
    const userMsg = { role: "user", content: t }; const history = [...chat.filter((m) => !m.err), userMsg].slice(-12);
    setChat((c) => [...c, { ...userMsg, at: Date.now() }]); setBusy(true);
    try {
      const res = await fetch(WEB ? "/api/coach" : "https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, system: SYSTEM + "\n\n" + buildContext({ state, week, lineup, byId, bench, irList, rec, opp, oppName, power, freeAgents, question: t }), messages: history.map((m) => ({ role: m.role, content: m.content })), tools: [{ type: "web_search_20250305", name: "web_search" }] }) });
      const data = await res.json(); if (data.error) throw new Error(data.error.message || "API error");
      const blocks = data.content || [];
      const txt = blocks.filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      const seen = new Set(); const sources = [];
      blocks.forEach((b) => { if (b.type === "web_search_tool_result" && Array.isArray(b.content)) b.content.forEach((r) => { if (r.url && !seen.has(r.url) && sources.length < 5) { seen.add(r.url); sources.push({ url: r.url, title: r.title || r.url }); } }); });
      const searches = blocks.filter((b) => b.type === "server_tool_use").length;
      setChat((c) => [...c, { role: "assistant", content: txt || "I came back empty. Ask again with a little more detail.", sources, searches, at: Date.now() }]);
    } catch (e) { setChat((c) => [...c, { role: "assistant", content: `Could not reach the coach: ${e.message}. Try again in a moment.`, err: true, at: Date.now() }]); } finally { setBusy(false); }
  };
  const tm = (at) => (at ? new Date(at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "");
  return (
    <div className="coachwrap">
      <div className="coachhead">
        <div className="av"><IconSvg k="whistle" /></div>
        <div style={{ minWidth: 0, flex: 1 }}><div className="nm">Coach<i /></div><div className="st">All 14 rosters, both projection sets, Sept 7 notes. Checks the web before answering.</div></div>
        {chat.length > 0 && <button className="btn sm" onClick={() => setChat(() => [])}>Clear</button>}
      </div>
      <div className="sugg">{sugg.map((g) => <button key={g.k} className="sg" onClick={() => send(g.q)}><span className="ic"><IconSvg k={g.k} /></span><span className="t">{g.t}</span><span className="s">{g.s}</span></button>)}</div>
      <div className="msgs" style={{ paddingBottom: 132 }}>
        {chat.length === 0 && <div className="empty" style={{ padding: "6px 4px" }}>Pick a card above or ask anything. Start/sit, a trade, who to claim, what {oppName} is thinking.</div>}
        {chat.map((m, i) => m.role === "user" ? <div key={i} className="msg u">{m.content}</div> : (
          <div key={i} className={"msg a" + (m.err ? " err" : "")}>
            <div className="av"><IconSvg k="whistle" /></div>
            <div className="body">
              <div className="who">Coach<span>{m.searches ? `${m.searches} web search${m.searches > 1 ? "es" : ""}` : ""}{m.at ? ` ${tm(m.at)}` : ""}</span></div>
              <CoachMd text={m.content} />
              {m.sources && m.sources.length > 0 && <div className="srcs"><span className="lbl">Sources</span>{m.sources.map((sr) => <a key={sr.url} href={sr.url} target="_blank" rel="noreferrer">{sr.title.replace(/\s*[-|].*$/, "").slice(0, 40)}</a>)}</div>}
            </div>
          </div>))}
        {busy && <div className="msg a"><div className="av"><IconSvg k="whistle" /></div><div className="body"><div className="thinking"><span className="dots"><i /><i /><i /></span>{THINK[tick % THINK.length]}</div></div></div>}
        <div ref={endRef} />
      </div>
      <div className="composer"><div className="in"><textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Coach anything" rows={1} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} /><button className="send" onClick={() => send()} disabled={busy || !input.trim()} aria-label="Send"><IconSvg k="send" /></button></div></div>
    </div>
  );
}

// =============================================================================
// IMPORT (paste from Yahoo transactions)
// =============================================================================
function ImportSheet({ seen, onApply, onClose }) {
  const [txt, setTxt] = useState(""); const [moves, setMoves] = useState(null);
  const parse = () => { const mv = parseYahooTx(txt); setMoves(mv.map((m) => ({ ...m, skip: seen.includes(m.key) }))); };
  const setMove = (i, patch) => setMoves((ms) => ms.map((m, j) => (j === i ? { ...m, ...patch, key: `${m.date}|${patch.act || m.act}|${m.player.id}|${patch.team != null ? patch.team : m.team}` } : m)));
  const ready = moves && moves.some((m) => !m.skip && m.team);
  return (
    <Sheet title="Paste Yahoo transactions" sub="Open your league's Transactions page in Yahoo, select all, copy, paste below. Adds, drops and trades are picked up." onClose={onClose}>
      {!moves ? (<>
        <div className="field"><textarea className="notes" value={txt} onChange={(e) => setTxt(e.target.value)} placeholder={"Jake Bates Det - K\nFree Agent\nEddy Pineiro SF - K\nTo Waivers\nDonnie Dimes\nSep 7, 9:37 am"} style={{ minHeight: 180, fontSize: 14 }} /></div>
        <div className="btns" style={{ paddingTop: 0 }}><button className="btn pri" disabled={!txt.trim()} onClick={parse}>Read it</button></div>
        <div className="hint">Already-logged moves are skipped automatically, so you can paste the whole page every week.</div>
      </>) : (<>
        <div className="ssec"><span>{moves.length} move{moves.length === 1 ? "" : "s"} found</span><span>{moves.filter((m) => m.skip).length} already logged</span></div>
        {moves.length === 0 && <div className="empty">Could not find any player lines. Make sure the paste includes the player names with team and position, like "Jake Bates Det - K".</div>}
        <div className="card">{moves.map((m, i) => (
          <div key={i} className={"prow" + (m.skip ? " dim" : "")} style={{ gridTemplateColumns: "auto 1fr" }}>
            <Badge p={m.player} />
            <div>
              <div className="pname"><span className="t">{m.player.n}</span>{m.player.custom && <span className="pill own">new</span>}{m.skip && <span className="pill own">logged</span>}</div>
              <div className="grid2" style={{ marginTop: 6, gap: 6 }}>
                <select value={m.act} onChange={(e) => setMove(i, { act: e.target.value })} style={{ padding: "7px 8px", fontSize: 13 }}><option value="add">Added by</option><option value="drop">Dropped by</option><option value="trade">Traded to</option></select>
                <select value={m.team} onChange={(e) => setMove(i, { team: e.target.value })} style={{ padding: "7px 8px", fontSize: 13, borderColor: m.team ? undefined : "var(--stop)" }}><option value="">Pick a team</option>{LEAGUE_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}</select>
              </div>
              <div className="small muted" style={{ marginTop: 4 }}>{m.date || "no date"}{m.teams.length > 1 ? `, between ${m.teams.join(" and ")}` : ""}</div>
            </div>
          </div>))}</div>
        <div className="btns"><button className="btn pri" disabled={!ready} onClick={() => onApply(moves.filter((m) => !m.skip && m.team))}>Log {moves.filter((m) => !m.skip && m.team).length} move{moves.filter((m) => !m.skip && m.team).length === 1 ? "" : "s"}</button><button className="btn" onClick={() => setMoves(null)}>Back</button></div>
        <div className="hint">Trades: Yahoo's paste does not always say who received whom, so check the team on each traded player before logging.</div>
      </>)}
    </Sheet>
  );
}

// =============================================================================
// MENU
// =============================================================================
function MenuSheet({ state, settings, onSettings, onReset, onImport, onClose }) {
  const [mode, setMode] = useState("main"); const [txt, setTxt] = useState(""); const [msg, setMsg] = useState(""); const [confirm, setConfirm] = useState(false);
  const json = JSON.stringify({ ...state, chat: [] });
  const copy = async () => { try { await navigator.clipboard.writeText(json); setMsg("Copied. Paste it somewhere safe."); } catch (e) { setMsg("Copy blocked here. Select the text and copy it."); setMode("export"); } };
  return (
    <Sheet title="Settings and data" sub="Everything saves automatically. Export is your backup." onClose={onClose}>
      {mode === "main" && (<>
        <div className="field"><label>Look</label><div className="seg">{[["auto", "Auto"], ["light", "Call sheet"], ["dark", "Night game"]].map(([k, l]) => <button key={k} className={settings.theme === k ? "on" : ""} onClick={() => onSettings({ theme: k })}>{l}</button>)}</div></div>
        <div className="field"><label>Team logo</label>
          <div className="btns" style={{ padding: 0 }}>
            <label className="btn" style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>{settings.logo ? "Replace logo" : "Upload the DIMES logo"}<input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => { const h = Math.min(160, img.height); const w = Math.round(img.width * (h / img.height)); const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").drawImage(img, 0, 0, w, h); onSettings({ logo: c.toDataURL("image/png") }); }; img.src = rd.result; }; rd.readAsDataURL(f); }} /></label>
            {settings.logo && <button className="btn" onClick={() => onSettings({ logo: null })}>Use the wordmark</button>}
          </div>
          <div className="small muted" style={{ marginTop: 6 }}>Transparent PNG works best on the navy bar. Kept at 160px tall.</div>
        </div>
        {!WEB && <div className="field"><label>Lines server</label><input value={settings.apiBase || DEFAULT_API} onChange={(e) => onSettings({ apiBase: e.target.value })} placeholder={DEFAULT_API} /><div className="small muted" style={{ marginTop: 6 }}>Your Vercel deployment. <a href={(settings.apiBase || DEFAULT_API)} target="_blank" rel="noreferrer" style={{ color: "var(--info)", fontWeight: 700 }}>Open the web version</a> if this view cannot reach it.</div></div>}
        {state.vegas && state.vegas.credits && <div className="hint" style={{ paddingTop: 0 }}>Odds API credits: {state.vegas.credits.used} used, {state.vegas.credits.remaining} remaining this month.</div>}
        <div className="field"><label>Roster spots (not counting IR)</label><div className="seg">{[16, 17].map((n) => <button key={n} className={settings.rosterLimit === n ? "on" : ""} onClick={() => onSettings({ rosterLimit: n })}>{n}</button>)}</div><div className="small muted" style={{ marginTop: 6 }}>Set to 17 because you and Nothing Else Matters both added a DEF without dropping anyone.</div></div>
        <div className="btns"><button className="btn" onClick={copy}>Copy backup</button><button className="btn" onClick={() => setMode("export")}>Show backup</button><button className="btn" onClick={() => setMode("import")}>Restore</button></div>
        {msg && <div className="hint">{msg}</div>}
        <div className="hint">Sources: Yahoo ADP Sept 5; season projections from Fantasy Index, Footballguys and PFF (Sept 7, equal weight); weekly projections from Footballguys and The Athletic/FantasyPros ranks as they are added; Fantasy Index notes; Hogg Heaven draft plus logged moves; 2026 NFL schedule; Vegas lines when pulled.</div>
        <div className="ssec"><span>Danger zone</span></div>
        <div className="btns">{!confirm ? <button className="btn danger" onClick={() => setConfirm(true)}>Reset everything</button> : <><button className="btn danger" onClick={onReset}>Yes, wipe it</button><button className="btn" onClick={() => setConfirm(false)}>Cancel</button></>}</div>
        <div className="hint">Reset restores the 14 draft-day rosters plus the Sept 7 transactions, and clears lineups, scores, watchlist, notes and chat.</div>
      </>)}
      {mode === "export" && <div className="field"><label>Backup (select all, copy)</label><textarea readOnly value={json} style={{ minHeight: 160, fontSize: 11, fontFamily: "monospace" }} onFocus={(e) => e.target.select()} /><div className="btns" style={{ padding: "10px 0 0" }}><button className="btn" onClick={() => setMode("main")}>Back</button></div></div>}
      {mode === "import" && <div className="field"><label>Paste a backup</label><textarea value={txt} onChange={(e) => setTxt(e.target.value)} style={{ minHeight: 140, fontSize: 12, fontFamily: "monospace" }} placeholder='{"v":3,"roster":[...]}' />{msg && <div className="small" style={{ color: "var(--stop)", marginTop: 6 }}>{msg}</div>}<div className="btns" style={{ padding: "10px 0 0" }}><button className="btn pri" onClick={() => { if (!onImport(txt)) setMsg("That did not look like a Dimes backup."); }} disabled={!txt.trim()}>Restore</button><button className="btn" onClick={() => setMode("main")}>Back</button></div></div>}
    </Sheet>
  );
}
