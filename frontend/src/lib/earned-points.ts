// Query parameter a server action adds to its redirect when it earned the
// user points; components/earned-points-toast.tsx turns it into a toast.
export const EARNED_PARAM = "earned";

// Points already announced by that toast, so the dashboard's "new points"
// toast (components/level-progress.tsx) doesn't announce them again.
export const TOASTED_POINTS_KEY = "rg:toasted-points";
