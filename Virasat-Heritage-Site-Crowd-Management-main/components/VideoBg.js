"use client";
export default function VideoBg() {
  return (<>
    <video className="bgvideo" autoPlay muted loop playsInline poster="/poster.jpg"><source src="/heritage.mp4" type="video/mp4" /></video>
    <div className="veil" />
  </>);
}
