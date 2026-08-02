# 🛡️ IAM & CloudWatch Setup Guide

This guide documents security access control using **AWS IAM** and operational monitoring using **AWS CloudWatch**.

---

## 🔒 1. Scoped IAM User (Least-Privilege Access)

Operating with the root account for daily development is insecure. Use a dedicated scoped IAM user instead.

### **Step A: Create Custom IAM Policy**
In **AWS IAM Console** ➡️ **Policies** ➡️ **Create Policy** ➡️ **JSON**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2InstanceManagement",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances",
        "ec2:GetConsoleOutput"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchMetricsRead",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics"
      ],
      "Resource": "*"
    }
  ]
}
```

Name: `PulseboardEC2ManagerPolicy`.

---

### **Step B: Create IAM User**
1. In IAM Console, go to **Users** ➡️ **Create user**.
2. **User Name:** `pulseboard-deployer`.
3. Choose **Attach policies directly** ➡️ Select `PulseboardEC2ManagerPolicy`.
4. Click **Create user**.

---

### **Step C: Generate CLI Credentials**
1. Go to user `pulseboard-deployer` ➡️ **Security credentials** ➡️ **Create access key**.
2. Select **Command Line Interface (CLI)**.
3. Save Access Key ID and Secret Access Key.

Configure CLI locally:
```bash
aws configure
# Access Key ID: <YOUR_ACCESS_KEY_ID>
# Secret Access Key: <YOUR_SECRET_ACCESS_KEY>
# Default region: us-east-1
# Default output format: json
```

---

## 📊 2. CloudWatch Infrastructure Monitoring & CPU Alarm

### **Step A: Monitor System Metrics**
In **EC2 Console** ➡️ Select instance ➡️ **Monitoring** tab:
* `CPUUtilization` (% CPU load)
* `NetworkIn` / `NetworkOut` (Network data volume)
* `StatusCheckFailed` (Hardware & system health)

---

### **Step B: Create CPU Alarm (> 80% Load Alert)**
1. Open **CloudWatch Console** ➡️ **Alarms** ➡️ **Create alarm**.
2. Select metric ➡️ **EC2** ➡️ **Per-Instance Metrics** ➡️ Select `CPUUtilization` for target backend instance.
3. **Period:** `5 minutes`.
4. **Threshold:** Static, `Greater/Equal (>= 80%)`.
5. **Notification:** Create SNS topic `PulseboardAlertsTopic` with subscriber email `<YOUR_EMAIL>`.
6. Name: `Pulseboard-EC2-HighCPU-Alarm`.
7. Click **Create alarm**.

---

### **Step C: Confirm SNS Subscription**
Confirm the subscription via the link sent to your email inbox to activate CPU alarm notifications.
