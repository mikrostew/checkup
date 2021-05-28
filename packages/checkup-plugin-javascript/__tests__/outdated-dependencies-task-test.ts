import '@microsoft/jest-sarif';
import { CheckupProject, getTaskContext } from '@checkup/test-helpers';
import { getPluginName, Task } from '@checkup/core';
import { Result } from 'sarif';
import OutdatedDependenciesTask from '../src/tasks/outdated-dependencies-task';
import { evaluateActions } from '../src/actions/outdated-dependency-actions';

// this test actually checks if dependencies are out of date, and will fail if new versions of react and react-dom are released.
describe('outdated-dependencies-task', () => {
  let project: CheckupProject;
  let pluginName = getPluginName(__dirname);
  let task: Task;
  let results: Result[];

  beforeAll(async () => {
    project = new CheckupProject('checkup-app', '0.0.0', (project) => {
      project.addDependency('react', '16.0.0');
      project.addDependency('ember-cli', '3.20.0');
    });

    project.writeSync();
    project.gitInit();
    project.install();

    task = new OutdatedDependenciesTask(
      pluginName,
      getTaskContext({
        options: { cwd: project.baseDir },
        pkg: project.pkg,
      })
    );

    results = await task.run();
  });

  afterAll(() => {
    project.dispose();
  });

  it('detects outdated dependencies as JSON', async () => {
    for (let result of results) {
      expect(result).toBeValidSarifFor('result');
    }
  });

  it('returns correct action items if too many dependencies are out of date (and additional actions for minor/major out of date)', async () => {
    let actions = evaluateActions(results, task.config);

    expect(actions).toHaveLength(3);
    expect(actions).toMatchInlineSnapshot(`
      Array [
        Object {
          "defaultThreshold": 0.05,
          "details": "1 major versions outdated",
          "input": 0.5,
          "items": Array [],
          "name": "reduce-outdated-major-dependencies",
          "summary": "Update outdated major versions",
          "taskName": "outdated-dependencies",
        },
        Object {
          "defaultThreshold": 0.05,
          "details": "1 minor versions outdated",
          "input": 0.5,
          "items": Array [],
          "name": "reduce-outdated-minor-dependencies",
          "summary": "Update outdated minor versions",
          "taskName": "outdated-dependencies",
        },
        Object {
          "defaultThreshold": 0.2,
          "details": "100% of versions outdated",
          "input": 1,
          "items": Array [],
          "name": "reduce-outdated-dependencies",
          "summary": "Update outdated versions",
          "taskName": "outdated-dependencies",
        },
      ]
    `);
  });
});
