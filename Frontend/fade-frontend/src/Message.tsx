
type MessageProps={
    text:string,
    from:string,
    isMine:boolean;
}

export default function Message({text,from,isMine}:MessageProps){
    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[70%] px-3 py-2 rounded-xl text-sm leading-relaxed
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