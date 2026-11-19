"use client";

import Link from "next/link";
import { BsFacebook, BsTwitterX, BsLinkedin, BsYoutube, BsInstagram } from "react-icons/bs";
import { useSiteSettings } from "@/context/SiteSettingsContext";
import { assetUrl } from "@/lib/asset";

const socialLinks = [
  { key: "facebook_url", Icon: BsFacebook, label: "Facebook" },
  { key: "twitter_url", Icon: BsTwitterX, label: "X" },
  { key: "linkedin_url", Icon: BsLinkedin, label: "LinkedIn" },
  { key: "youtube_url", Icon: BsYoutube, label: "YouTube" },
  { key: "instagram_url", Icon: BsInstagram, label: "Instagram" },
] as const;

export default function FrontFooter() {
  const { siteSettings, loading } = useSiteSettings();
  if (loading || !siteSettings) return null;
  const h = siteSettings.home_settings ?? {};
  const help = (siteSettings.front_menu ?? []).filter((m) => m.parent_id === 0 && m.type === 2);
  const helpLinks = help.some((m) => m.link === "/faq" || m.name.toLowerCase() === "faq")
    ? help
    : [{ id: "faq", name: "FAQ", link: "/faq" }, ...help];

  return (
    <footer>
      <div className="mainFooter">
        <div className="container-xxl">
          <div className="row gy-4">
            <div className="col-md-3 col-sm-4 order-1">
              <p className="fw-semibold mb-1">Developed and Managed by</p>
              <div className="footer-logo mb-2">
                <img src={assetUrl(h.footer_logo, "/footer_new_img.jpeg")} alt="ELCINA Logo" loading="lazy" decoding="async" />
              </div>
            </div>
            <div className="col-md-6 order-md-2 order-3 pe-lg-5">
              <div className="electronicpart pe-lg-5">
                <p className="fw-semibold mb-1">{h.footer_heading}</p>
                <p className="small mb-0">{h.footershort_description}</p>
              </div>
            </div>
            <div className="col-md-3 col-sm-6 text-md-start text--center order-md-3 order-2">
              <div className="supportclass">
                <p className="fw-semibold mb-1">Supporting Associations</p>
                <div className="supporting-logos">
                  <img src={assetUrl(h.footer_img_1, "/mait.jpg")} alt="MAIT" className="mb-1" loading="lazy" decoding="async" />
                  <img src={assetUrl(h.footer_img_2, "/cimei.png")} alt="CIMEI" className="mb-1" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
          </div>
          <hr className="border-light opacity-25 my-4" />
          <div className="row gy-4">
            <div className="col-lg-2 col-sm-5">
              <p className="footer-section-title">Need Help?</p>
              <ul className="list-unstyled mb-0">
                {helpLinks.map((m) => <li key={m.id}><Link href={m.link || "/"}>{m.name}</Link></li>)}
              </ul>
            </div>
            <div className="col-md-4 col-sm-5 footer-border">
              <p className="footer-section-title">Policy</p>
              <ul className="list-unstyled mb-0">
                <li><a href="#">Schemes for Electronics Manufacturing</a></li>
                <li><a href="#">State ESDM Policies</a></li>
                <li><a href="#">Union Budget for ESDM sector</a></li>
                <li><a href="#">Foreign Trade Policy 2015-20</a></li>
                <li><a href="#">Duty Draw Back</a></li>
              </ul>
            </div>
            <div className="col-lg-2 col-sm-5 col-sm-3 footer-border">
              <p className="footer-section-title">Quick Links</p>
              <ul className="list-unstyled mb-0">
                <li><a href="#">For Exporters</a></li>
                <li><a href="#">Work With Us</a></li>
                <li><Link href="/plans">Subscription Plans</Link></li>
                <li><a href="https://elcina.com/testlab-india">Test Labs in India</a></li>
              </ul>
            </div>
            <div className="col-lg-4 col-sm-5 footer-border">
              <p className="footer-section-title">Contact Us</p>
              <div className="d-flex mb-1">
                <i className="bx bx-phone me-1" />
                <div className="d-flex flex-wrap">
                  {h.contactphone_1 && <a href={`tel:${h.contactphone_1}`}>{h.contactphone_1}</a>}
                  {h.contactphone_1 && h.contactphone_2 && <span>&nbsp;/&nbsp;</span>}
                  {h.contactphone_2 && <a href={`tel:${h.contactphone_2}`}>{h.contactphone_2}</a>}
                </div>
              </div>
              {h.contactemail && <p className="d-flex mb-1"><i className="bx bx-envelope me-1" /><a href={`mailto:${h.contactemail}`}>{h.contactemail}</a></p>}
              {h.contactaddress && <div className="d-flex"><i className="bx bx-map me-1" />{h.contact_map_url ? <a href={h.contact_map_url} className="mb-2">{h.contactaddress.replace(/<[^>]*>/g, " ")}</a> : <div className="mb-2">{h.contactaddress.replace(/<[^>]*>/g, " ")}</div>}</div>}
              <div className="social-icons">
                {socialLinks.map(({ key, Icon, label }) => h[key] ? <a key={key} href={h[key]} target="_blank" rel="noopener noreferrer" aria-label={label}><Icon aria-hidden="true" /></a> : null)}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="copyrightsection bg-white">
        <div className="container"><div className="footer-bottom py-2 mt-0">© Copyright 2026 <a href="/" className="fw-bolder">ELCINA</a>. All Rights Reserved</div></div>
      </div>
    </footer>
  );
}
