FROM eclipse-temurin:17-jdk-jammy
WORKDIR /app

# Copy prebuilt JAR from host build context
# Ensure you run `mvn clean package -DskipTests` in the `backend` folder before building the image
COPY backend/target/*.jar app.jar

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java","-jar","/app/app.jar"]
