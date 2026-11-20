import styles from "../account/account.module.css";

export default function UserFooter() {
  return <footer className={styles.footer}>Copyright © {new Date().getFullYear()}. All right reserved.</footer>;
}
