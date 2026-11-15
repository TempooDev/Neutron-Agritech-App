# Imagen para los servicios .NET de la demo (API y gateway).
# Uso: docker build -f aspire/Dockerfile --build-arg PROJECT=Neutron.DemoApi aspire
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG PROJECT
WORKDIR /src
COPY Directory.Build.props ./
COPY Neutron.ServiceDefaults/Neutron.ServiceDefaults.csproj Neutron.ServiceDefaults/
COPY ${PROJECT}/${PROJECT}.csproj ${PROJECT}/
RUN dotnet restore ${PROJECT}/${PROJECT}.csproj
COPY Neutron.ServiceDefaults/ Neutron.ServiceDefaults/
COPY ${PROJECT}/ ${PROJECT}/
RUN dotnet publish ${PROJECT}/${PROJECT}.csproj -c Release -o /app --no-restore \
    && echo "${PROJECT}.dll" > /app/entrypoint.txt

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec dotnet $(cat entrypoint.txt)"]
