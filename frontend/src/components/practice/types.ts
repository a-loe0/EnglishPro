export interface ActivityProps<A> {
  activity: A;
  // Called once, when the learner finishes. score <= total.
  onFinish: (score: number, total: number) => void;
}
