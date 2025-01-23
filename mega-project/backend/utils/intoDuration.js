const secondsIntoDuration=(totalSeconds) => {
    const seconds=totalSeconds%60;
    const totalMinutes=Math.floor(totalSeconds/60);
    const minutes=totalMinutes/60;
    const hours=Math.floor(totalMinutes/60);

    if(hours > 0){
        return `${hours}h ${minutes}m`;
    }
    else if(minutes > 0){
        return `${minutes}m ${seconds}s`;
    }
    else{
        return `${seconds}s`
    }
}

module.exports=secondsIntoDuration;