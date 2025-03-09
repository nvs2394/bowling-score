# AWS Infrastructure Setup with Terraform

This Terraform configuration sets up the necessary AWS infrastructure for the Bowling Score Tracker application, including EC2, MongoDB (DocumentDB), networking, and security groups.

## Prerequisites

Ensure you have the following installed:

- [Terraform](https://www.terraform.io/downloads)
- [AWS CLI](https://aws.amazon.com/cli/) (configured with appropriate IAM permissions)

## Folder Structure

```
infra/
├── envs/
│   ├── dev/
│   │   ├── tfvars.tfvar
│   ├── prod/
│   │   ├── prod.tfvar
├── modules/
│   ├── compute/
│   ├── database/
│   ├── networking/
├── main.tf
├── outputs.tf
├── providers.tf
├── variables.tf
├── README.md
```

## Environment Variables

Ensure you have your AWS credentials set up before running Terraform:

## Usage

### 1. Initialize Terraform

Run the following command to initialize Terraform and download necessary providers:

```sh
terraform init
```

### 2. Plan the Deployment

Generate an execution plan to review the infrastructure changes before applying:

```sh
terraform plan -var-file=envs/dev/tfvars.tfvar
```

For production, run:

```sh
terraform plan -var-file=envs/prod/prod.tfvar
```

### 3. Apply the Configuration

Apply the infrastructure changes:

```sh
terraform apply -var-file=envs/dev/tfvars.tfvar
```

For production:

```sh
terraform apply -var-file=envs/prod/prod.tfvar
```

### 4. Destroy the Infrastructure (Optional)

To tear down the infrastructure, run:

```sh
terraform destroy -var-file=envs/dev/tfvars.tfvar
```

For production:

```sh
terraform destroy -var-file=envs/prod/prod.tfvar
```

## Outputs

After applying Terraform, you can retrieve the output values by running:

```sh
terraform output
```
