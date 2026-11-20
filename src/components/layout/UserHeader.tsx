"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { assetUrl } from "@/lib/asset";
import styles from "../account/account.module.css";

export default function UserHeader({ menuOpen, toggleMenu }: { menuOpen: boolean; toggleMenu: () => void }) {
  const { user, logout } = useAuth();
  const router = useRouter();

  return <header className={styles.header}>
    <nav className={styles.toolbar} aria-label="Account toolbar">
      <button type="button" className={`btn ${styles.mobileToggle}`} aria-label="Toggle account menu"
        aria-controls="account-sidebar" aria-expanded={menuOpen} onClick={toggleMenu}>
        <i className="bx bx-menu fs-4" aria-hidden="true" />
      </button>
      <div className={styles.company}>{user?.company_info?.organization_name}</div>
      <div className={styles.headerActions}>
        <button type="button" className="btn btn-outline-primary" disabled>Sourcing Interest</button>
        <Link className="btn btn-primary" href="/"><i className="bx bx-arrow-back me-1" aria-hidden="true" />Back to Home</Link>
      </div>
      <div className="dropdown">
        <button type="button" className={`btn d-flex align-items-center gap-2 dropdown-toggle ${styles.accountButton}`}
          data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account options">
          <img src={assetUrl(user?.file?.file, "/user.png")} alt="" className={styles.avatar} onError={(event) => {
            if (!event.currentTarget.src.endsWith("/user.png")) event.currentTarget.src = "/user.png";
          }} />
          {user?.fname?.charAt(0).toUpperCase()}{user?.lname?.charAt(0).toUpperCase()}
        </button>
        <ul className="dropdown-menu dropdown-menu-end">
          <li><Link className="dropdown-item" href="/profile"><i className="bx bx-cog me-2" aria-hidden="true" />Profile</Link></li>
          <li><Link className="dropdown-item" href="/dashboard"><i className="bx bx-home-circle me-2" aria-hidden="true" />Dashboard</Link></li>
          <li><hr className="dropdown-divider" /></li>
          <li><button type="button" className="dropdown-item" onClick={() => { logout(); router.replace("/login"); }}>
            <i className="bx bx-log-out-circle me-2" aria-hidden="true" />Logout
          </button></li>
        </ul>
      </div>
    </nav>
  </header>;
}
