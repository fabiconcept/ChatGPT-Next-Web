import styles from "./loading.module.scss";

export function Loading() {
  return (
    <div className={styles["loading-content"]}>
      <div className={styles["loading-spinner"]} />
      <span className={styles["loading-text"]}>Loading...</span>
    </div>
  );
}
