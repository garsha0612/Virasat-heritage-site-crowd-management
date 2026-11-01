import Link from "next/link";
export default function Nav() {
  return (<nav><Link href="/"><b>VIRASAT</b></Link>
    <div><Link href="/#sites">Sites</Link><Link href="/#crowd">Crowd</Link><Link href="/#book">Book</Link><Link href="/#live">Live</Link></div></nav>);
}
