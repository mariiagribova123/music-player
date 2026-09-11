/* Lightweight audio-feature heuristic, shared by bundled and imported tracks. */
(function(root){
  function classify(buffer){
    const data=buffer.getChannelData(0),rate=buffer.sampleRate;
    let power=0,crossings=0,count=0;const levels=[];
    // Contiguous windows preserve frequency information regardless of song length.
    const windowSize=Math.max(1,Math.floor(rate*.05));
    for(const fraction of [.15,.4,.65]){
      const start=Math.floor(data.length*fraction),end=Math.min(data.length,start+rate*12);
      for(let offset=start;offset<end;offset+=windowSize){
        let sum=0;const stop=Math.min(end,offset+windowSize);
        for(let i=offset;i<stop;i++){const sample=data[i];sum+=sample*sample;if(i>offset&&(sample>=0)!==(data[i-1]>=0))crossings++;count++}
        power+=sum;levels.push(Math.sqrt(sum/(stop-offset)));
      }
    }
    if(!count)throw Error('Empty audio');
    const energy=Math.sqrt(power/count),brightness=crossings/count;
    const mean=levels.reduce((a,b)=>a+b,0)/levels.length;
    const variation=Math.sqrt(levels.reduce((a,b)=>a+(b-mean)**2,0)/levels.length)/(mean||1);
    let pulses=0;for(let i=1;i<levels.length;i++)if(levels[i]>levels[i-1]*1.3&&levels[i]>mean)pulses++;
    const rhythm=pulses/levels.length;
    let mood='vibe';
    if(energy<.065)mood=variation>.65?'dream':'chill';
    else if(energy<.12&&rhythm<.12)mood=brightness<.075?'focus':'glow';
    else if(energy>.2||rhythm>.2)mood=brightness>.09?'party':'drive';
    else if(variation>.8)mood='dream';
    else if(brightness>.12)mood='glow';
    return {mood,energy,brightness,variation,rhythm};
  }
  root.FormaMood={classify,version:1};
  if(typeof module!=='undefined')module.exports=root.FormaMood;
})(typeof window!=='undefined'?window:globalThis);
