import Link from "next/link";
export default function GetSupportPage(){return <section className="my-5"><div className="container-xxl">
<div className="card mb-5 commonHead border shodow-none"><div className="card-body py-5 d-flex align-items-center justify-content-center"><div className="firstHead text-center"><h1 className="mb-0 text-white">GET SUPPORT</h1></div></div></div>
<div className="knowledgeBox"><div className="card"><div className="card-body py-md-4 pe-lg-5"><div className="row">
<div className="col-lg-4 col-md-5"><div className="contact-info ps-lg-4 pe-lg-3 border-end h-100"><h4>MEET US</h4>
<div className="info-item d-flex align-items-start mt-4"><div><h6 className="text-orange">Call Us Now</h6><p><a href="tel:+911141615985" className="nav-link">+91-11-41615985</a><a href="tel:+911141011291" className="nav-link">+91-11-41011291</a></p></div></div>
<div className="info-item d-flex align-items-start"><div><h6 className="text-orange">Our Location</h6><p>Elcina House, 422, Okhla Industrial Estate, Phase-III, New Delhi, Delhi 110020</p></div></div>
<div className="info-item d-flex align-items-start"><div><h6 className="text-orange">Write Us Now</h6><p>support@sourceindia-electronics.com</p></div></div>
</div></div>
<div className="col-lg-8 col-md-7"><div className="contact-form"><h4 className="mb-4">Please Create Your Support Ticket</h4><div className="row pt-lg-1">
{[{title:"Create Ticket",href:"/get-support/createticket"},{title:"Track a Ticket",href:"/get-support/trackticket"}].map(item=><div className="col-sm-6 mb-3" key={item.href}><div className="card supportTicket"><div className="card-body"><Link href={item.href} className="d-block"><div className="text-center ticketicon"><i className="bx bx-envelope-open" aria-hidden="true"/><h6>{item.title}</h6></div></Link></div></div></div>)}
</div></div></div>
</div></div></div></div></div></section>}
