import cron from "node-cron";

cron.schedule("* * * * * ", async () => {
  try {
    const now = new Date();
    console.log("Node corn is running");
  } catch (error) {
    console.error("Error in cron job:", error);
  }
});
