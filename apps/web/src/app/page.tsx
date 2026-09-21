import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.page}>
      <h1>Hazard Map Project</h1>
      <p>Validation Release — frontend scaffold</p>
      <Link className={styles.cta} href="/map-creator">
        Map Creatorを開く
      </Link>
    </main>
  );
}
