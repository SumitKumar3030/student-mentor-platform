import { useState } from 'react';



function Clock() {
    const [time, setTime] = useState(0);

    return(

    //stopwatch
    <div>
    <h1 className='p-2 bg-blue-700 rounded-xl text-white'>Stop Watch</h1>
    <p className='p-4 text-black '>{time}</p>
    <button className='p-2 m-2 bg-blue-900 rounded-xl text-white'
     onClick={() => setTime(time + 1)}>Start</button>
    <button className='p-2 m-2 bg-red-500 rounded-xl text-white' 
     onClick={() => setTime(0)}>Reset</button>
    </div>

    );

}

export default Clock;