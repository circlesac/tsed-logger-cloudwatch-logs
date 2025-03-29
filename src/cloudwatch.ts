import { CloudWatchLogs, CreateLogGroupCommand, CreateLogStreamCommand, PutLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs"
import { Appender, BaseAppender, LogEvent } from "@tsed/logger"
import { $trycatch } from "@tszen/trycatch"

export const cloudWatchLogs = new CloudWatchLogs()

@Appender({ name: "cloudwatch-logs" })
export class CloudWatchLogsAppender extends BaseAppender {
	async write(logEvent: LogEvent) {
		const level = logEvent.level.toString().toLowerCase()
		if (level === "off") return

		// client
		const { region, endpoint, credentials, logGroupName } = this.config.options
		const logStreamName = logEvent.categoryName

		const cloudWatchLogs = new CloudWatchLogs({ region, endpoint, credentials })
		await $trycatch(cloudWatchLogs.send(new CreateLogGroupCommand({ logGroupName })))
		await $trycatch(cloudWatchLogs.send(new CreateLogStreamCommand({ logGroupName, logStreamName })))

		// log
		const message = this.layout(logEvent)
		const timestamp = logEvent.startTime.getTime()

		const command = new PutLogEventsCommand({
			logGroupName,
			logStreamName,
			logEvents: [{ message, timestamp }]
		})
		const [, err] = await $trycatch(cloudWatchLogs.send(command))
		if (err) console.error("Ts.ED Logger:cloudwatch-logs - Error sending log to CloudWatch Logs", err)
	}
}
