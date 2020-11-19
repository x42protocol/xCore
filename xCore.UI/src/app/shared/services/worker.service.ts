import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SimpleTimer } from 'ng2-simple-timer';
import { Worker, WorkerType } from '../models/worker';

@Injectable({
  providedIn: 'root'
})
export class WorkerService {
  private status = new Worker();
  private timerSubject = new BehaviorSubject<Worker>(this.status);

  public timerStatusChanged = this.timerSubject.asObservable();
  public types: Worker;

  constructor(private simpleTimer: SimpleTimer) { }

  public Stop(name: WorkerType): void {
    this.status = { running: false, worker: name };
    this.simpleTimer.unsubscribe(name.toString());
    this.simpleTimer.delTimer(name.toString());
  }

  public Start(name: WorkerType, seconds: number = 0): void {
    let tickSeconds = seconds;
    if (tickSeconds === undefined || tickSeconds === 0) {
      tickSeconds = 5;
    }

    const workers: string[] = this.simpleTimer.getTimer();
    const thisWorkerName = workers.find(i => i === name.toString());
    if (thisWorkerName === undefined) {
      this.simpleTimer.newTimer(name.toString(), tickSeconds, true);
    }

    const subscriptions: string[] = this.simpleTimer.getSubscription();
    const thisSubscription = subscriptions.find(i => i.startsWith(thisWorkerName + '-'));
    if (thisSubscription === undefined) {
      this.simpleTimer.subscribe(name.toString(), () => this.tick(true, name));
    }
  }

  private tick(isRunning: boolean, name: WorkerType): void {
    this.status = { running: isRunning, worker: name };
    this.timerSubject.next(this.status);
  }

}
