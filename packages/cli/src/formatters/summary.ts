import { BufferedWriter, CheckupLogParser, Formatter, FormatterOptions } from '@checkup/core';
import { success } from 'log-symbols';
import { yellow } from 'chalk';
import { Log } from 'sarif';
import { writeResultsToFile } from './file-writer';
import BaseFormatter from './base-formatter';

export default class SummaryFormatter extends BaseFormatter<BufferedWriter> implements Formatter {
  constructor(options: FormatterOptions) {
    super(options);

    this.writer = new BufferedWriter();
  }

  format(logParser: CheckupLogParser) {
    let { metaData, log, actions, executedTasks } = logParser;

    this.renderMetadata(metaData);
    this.writer.log('Checkup ran the following task(s) successfully:');

    executedTasks
      .map((rule) => rule.id)
      .sort()
      .forEach((taskName) => {
        this.writer.log(`${success} ${taskName}`);
      });

    this.writeResultsToFile(log);
    this.renderActions(actions);
    this.writer.blankLine();
    this.renderCLIInfo(metaData);

    return this.writer.buffer;
  }

  writeResultsToFile(log: Log) {
    let resultsFilePath = writeResultsToFile(log, this.options.cwd, this.options.outputFile);

    this.writer.blankLine();
    this.writer.log('Results have been saved to the following file:');
    this.writer.log(yellow(resultsFilePath));
  }
}
