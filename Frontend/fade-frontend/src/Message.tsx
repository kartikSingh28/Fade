import {useEffect,useState} from "react";
type MessageProps={
    text:string,
    from:string,
    isMine:boolean;
    createdAt:number;
};

const TTL=60_000;
const FADE_TIME=10_000;

export default function Message({text,from,isMine,createdAt}:MessageProps){
  const [opacity,setOpacity]=useState(1);

  useEffect(()=>{
    const interval=setInterval(()=>{
      const age=Date.now()-createdAt;

      //agr age km ho ttl-fade time se (50se kam)
      if(age<TTL-FADE_TIME){
        setOpacity(1);

      }else{
        const remaining=TTL-age;
        setOpacity(Math.max(remaining/FADE_TIME,0));//fade out logic
      }
    },500);

    return ()=> clearInterval(interval)
  },[createdAt]);//hr created at time pr re render hoga
  

    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}
        style={{opacity}}>
      <div
        className={`
          max-w-[70%] px-3 py-2 rounded-xl text-sm leading-relaxed
          transition-opacity duration-500
          ${isMine
            ? "bg-fade-border text-fade-text rounded-br-sm"
            : "bg-fade-surface text-fade-text border border-fade-border rounded-bl-sm"}
        `}
      >
        {!isMine && (
          <div className="text-xs text-fade-muted mb-1">
            {from}
          </div>
        )}
        <div>{text}</div>
      </div>
    </div>
  );
}