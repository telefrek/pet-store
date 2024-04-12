#!/bin/bash

export BROWSER=wslview

# Verify we have helm
if ! command -v helm &> /dev/null
then
    echo "helm could not be found, please install first"
    exit 1
fi

# Verify we have minikube
if ! command -v minikube &> /dev/null
then
    echo "minikube could not be found, please install first"
    exit 1
fi

# Verify minikube is running
if [[ -z $(minikube status | grep Running) ]]; 
then
    minikube start
fi

# Check required chart repos
if [[ -z $(helm repo list | grep prometheus-community) ]]; 
then
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
fi

if [[ -z $(helm repo list | grep grafana) ]]; 
then
    helm repo add grafana https://grafana.github.io/helm-charts 
fi

# Update helm
helm repo update

# Check if prometheus is running
if [[ $(kubectl get svc prometheus-server | grep Error) ]]; 
then
    helm install prometheus prometheus-community/prometheus
fi

if [[ $(kubectl get svc prometheus-server-ext | grep Error) ]]; 
then
    kubectl expose service prometheus-server --type=NodePort --target-port=9090 --name=prometheus-server-ext
fi

# Check if grafana is running
if [[ $(kubectl get svc grafana | grep Error) ]]; 
then
    helm install grafana grafana/grafana
fi

if [[ $(kubectl get svc grafana-ext | grep Error) ]]; 
then
    kubectl expose service grafana --type=NodePort --target-port=3000 --name=grafana-ext
fi

# show the connection endpoints for the services
echo "prometheus..."
minikube service prometheus-server-ext &

echo "grafana..."
minikube service grafana-ext &

echo "grafana password: $(kubectl get secret --namespace default grafana -o jsonpath="{.data.admin-password}" | base64 --decode)"