pipeline {
    agent any

    environment {
        JWT_SECRET = credentials('jwt-secret')
        DB_PASSWORD = credentials('db-password')
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Test & Build Backend') {
            steps {
                dir('backend') {
                    sh './mvnw clean verify'   // chạy unit test + build, FAIL pipeline nếu test đỏ
                }
            }
        }

        stage('Test & Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run build'
                    // Nếu có test: sh 'npm run test -- --run'
                }

            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker build -t gialegroup-backend:${IMAGE_TAG} ./backend'
                sh 'docker build -t gialegroup-frontend:${IMAGE_TAG} ./frontend'
            }
        }

        stage('Deploy') {
            steps {
                sh '''
                    export BACKEND_TAG=${IMAGE_TAG}
                    export FRONTEND_TAG=${IMAGE_TAG}
                    export JWT_SECRET=${JWT_SECRET}
                    export DB_PASSWORD=${DB_PASSWORD}
                    docker compose -f docker-compose.prod.yml up -d --remove-orphans
                '''
            }
        }
    }

    post {
        failure {
            echo 'Pipeline thất bại — kiểm tra log ở stage vừa đỏ.'
        }
        always {
            sh 'docker image prune -f'   // dọn image cũ, tránh server đầy ổ cứng sau nhiều lần build
        }
    }
}